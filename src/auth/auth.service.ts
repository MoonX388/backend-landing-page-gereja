// server_side/src/auth/auth.service.ts
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/users.entity';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService, // 🚀 Inject email service
  ) {}

  // 1. Logika Register + Kirim Email Verifikasi (Mode Background & Tracking)
  async register(body: any) {
    const { namaGereja, namaAdmin, email, password } = body;

    // Cek apakah email sudah terdaftar
    const userExists = await this.userRepository.findOne({ where: { email } });
    if (userExists) {
      throw new BadRequestException('Email ini sudah terdaftar!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const vToken = crypto.randomBytes(32).toString('hex'); // Token acak aman

    const newUser = this.userRepository.create({
      namaGereja,
      namaAdmin,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken: vToken,
    });

    // Simpan data ke PostgreSQL
    await this.userRepository.save(newUser);
    console.log(`[AuthService] Sukses menyimpan user baru ke database. Email: ${email}`);

    // 🚀 PERBAIKAN: Lepas 'await' agar pengiriman email tidak mem-block respon frontend
    console.log(`[AuthService] Memicu antrean kirim email verifikasi untuk: ${email}`);
    this.emailService.sendVerificationEmail(email, vToken).catch((err) => {
      // Jika server email gagal merespon, eror ditangkap di sini dan tercatat di Railway
      console.error('❌ [BACKGROUND EMAIL CRASH] Gagal mengirim email verifikasi:', err.message);
    });

    // Langsung kembalikan respon sukses ke client (tanpa menunggu email selesai dikirim)
    return { 
      message: 'Registrasi berhasil! Silakan periksa kotak masuk atau folder spam email Anda untuk melakukan verifikasi.' 
    };
  }

  // 2. Logika Verifikasi Email
  async verifyEmail(token: string) {
    const user = await this.userRepository.findOne({ where: { verificationToken: token } });
    if (!user) {
      throw new BadRequestException('Tautan verifikasi tidak valid atau telah kedaluwarsa.');
    }

    user.isVerified = true;
    user.verificationToken = null; // Hapus token setelah terpakai
    await this.userRepository.save(user);

    console.log(`[AuthService] Akun berhasil diverifikasi. Email: ${user.email}`);
    return { message: 'Email berhasil diverifikasi! Sekarang Anda bisa login.' };
  }

  // 3. Logika Login + Proteksi Verifikasi
  async login(body: any) {
    const { username, password } = body;

    const user = await this.userRepository.findOne({ where: { email: username } });
    if (!user) {
      throw new UnauthorizedException('Email atau kata sandi salah.');
    }

    // 🛡️ CEK VERIFIKASI EMAIL
    if (!user.isVerified) {
      throw new BadRequestException('Akun Anda belum diverifikasi. Silakan cek email Anda terlebih dahulu.');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Email atau kata sandi salah.');
    }

    // Buat token JWT payload
    const payload = { id: user.id, email: user.email };
    
    console.log(`[AuthService] User "${user.email}" sukses melakukan login.`);
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        namaGereja: user.namaGereja,
        namaAdmin: user.namaAdmin,
        email: user.email,
      },
    };
  }

  // 4. Logika Minta Link Lupa Sandi (Mode Background & Tracking)
  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Demi keamanan SaaS, disarankan tidak membocorkan email terdaftar/tidak ke publik.
      return { message: 'Jika email terdaftar, instruksi reset sandi telah dikirim.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // Masa berlaku 1 Jam

    await this.userRepository.save(user);
    console.log(`[AuthService] Token reset sandi berhasil dibuat untuk: ${email}`);

    // 🚀 PERBAIKAN: Lepas 'await' agar pengiriman email lupa sandi berjalan secara async di background
    console.log(`[AuthService] Memicu antrean kirim email lupa sandi untuk: ${email}`);
    this.emailService.sendResetPasswordEmail(email, resetToken).catch((err) => {
      console.error('❌ [BACKGROUND EMAIL CRASH] Gagal mengirim email lupa sandi:', err.message);
    });

    return { message: 'Tautan reset sandi berhasil dikirim ke email Anda.' };
  }

  // 5. Logika Eksekusi Reset Sandi Baru
  async resetPassword(body: any) {
    const { token, newPassword } = body;

    const user = await this.userRepository.findOne({ where: { resetPasswordToken: token } });
    if (!user) {
      throw new BadRequestException('Tautan tidak valid atau telah digunakan.');
    }

    // Cek apakah resetPasswordExpires bernilai null
    if (!user.resetPasswordExpires) {
      throw new BadRequestException('Tautan tidak valid atau telah kedaluwarsa.');
    }

    const now = new Date();
    const expiry = new Date(user.resetPasswordExpires); 

    if (expiry.getTime() < now.getTime()) {
      throw new BadRequestException('Tautan reset sandi telah kedaluwarsa.');
    }

    // Simpan sandi baru yang telah di-hash
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);

    console.log(`[AuthService] Kata sandi berhasil diperbarui untuk user ID: ${user.id}`);
    return { message: 'Kata sandi Anda berhasil diperbarui. Silakan login kembali.' };
  }

  // 6. FUNGSI PELENGKAP: Ambil data profil berdasarkan Token JWT
  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Pengguna tidak ditemukan');
    }

    return {
      id: user.id,
      namaGereja: user.namaGereja,
      namaAdmin: user.namaAdmin,
      email: user.email,
    };
  }
}
