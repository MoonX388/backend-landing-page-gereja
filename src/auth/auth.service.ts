import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(body: any) {
    const { namaGereja, namaAdmin, email, password } = body;
    const supabase = this.supabaseService.getClient();

    const subdomain = namaGereja.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    if (!subdomain || subdomain.length < 3) throw new BadRequestException('Nama gereja tidak valid untuk URL.');

    const { data: subExists } = await supabase.from('users').select('subdomain').eq('subdomain', subdomain).single();
    if (subExists) throw new BadRequestException('Subdomain sudah digunakan!');

    const { data: userExists } = await supabase.from('users').select('email').eq('email', email).single();
    if (userExists) throw new BadRequestException('Email sudah terdaftar!');

    const hashedPassword = await bcrypt.hash(password, 10);
    const vToken = crypto.randomBytes(32).toString('hex');

    const { error } = await supabase.from('users').insert([{ namaGereja, namaAdmin, email, password: hashedPassword, isVerified: false, verificationToken: vToken, subdomain }]);
    if (error) throw new BadRequestException('Gagal mendaftarkan akun.');

    this.emailService.sendVerificationEmail(email, vToken).catch(err => console.error(err));
    return { message: 'Registrasi berhasil!', subdomainFull: `${subdomain}.gerejapintar.id` };
  }

  async verifyEmail(token: string) {
    const supabase = this.supabaseService.getClient();
    const { data: user, error } = await supabase.from('users').select('*').eq('verificationToken', token).single();
    if (error || !user) throw new BadRequestException('Tautan tidak valid.');

    await supabase.from('users').update({ isVerified: true, verificationToken: null }).eq('id', user.id);
    return { message: 'Email berhasil diverifikasi!' };
  }

  async login(body: any) {
    const { username, password } = body;
    const supabase = this.supabaseService.getClient();

    const { data: user, error } = await supabase.from('users').select('*').eq('email', username).single();
    if (error || !user) throw new UnauthorizedException('Email atau kata sandi salah.');

    if (!user.isVerified) {
      const newVToken = crypto.randomBytes(32).toString('hex');
      await supabase.from('users').update({ verificationToken: newVToken }).eq('id', user.id);
      this.emailService.sendVerificationEmail(user.email, newVToken).catch(err => console.error(err));
      throw new BadRequestException('Akun belum diverifikasi. Tautan baru telah dikirim.');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) throw new UnauthorizedException('Email atau kata sandi salah.');

    const payload = { id: user.id, email: user.email };
    return {
      token: this.jwtService.sign(payload),
      user: { id: user.id, namaGereja: user.namaGereja, namaAdmin: user.namaAdmin, email: user.email },
    };
  }

  async forgotPassword(email: string) {
    const supabase = this.supabaseService.getClient();
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) return { message: 'Instruksi reset sandi telah dikirim jika terdaftar.' };

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000).toISOString(); 

    await supabase.from('users').update({ resetPasswordToken: resetToken, resetPasswordExpires: expires }).eq('id', user.id);
    this.emailService.sendResetPasswordEmail(email, resetToken).catch(err => console.error(err));
    return { message: 'Tautan reset sandi berhasil dikirim.' };
  }

  async resetPassword(body: any) {
    const { token, newPassword } = body;
    const supabase = this.supabaseService.getClient();

    const { data: user, error } = await supabase.from('users').select('*').eq('resetPasswordToken', token).single();
    if (error || !user || !user.resetPasswordExpires) throw new BadRequestException('Tautan tidak valid.');
    if (new Date(user.resetPasswordExpires).getTime() < Date.now()) throw new BadRequestException('Tautan kedaluwarsa.');

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await supabase.from('users').update({ password: newHashedPassword, resetPasswordToken: null, resetPasswordExpires: null }).eq('id', user.id);
    return { message: 'Kata sandi berhasil diperbarui.' };
  }

  async checkSubdomainValid(subdomain: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('users').select('subdomain, namaGereja').eq('subdomain', subdomain).single();
    if (error || !data) return { valid: false, namaGereja: null };
    return { valid: true, namaGereja: data.namaGereja };
  }

  async getAllPublicChurches() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('users').select('id, namaGereja, subdomain').order('namaGereja', { ascending: true });
    if (error) throw new BadRequestException('Gagal memuat direktori.');
    return data;
  }

  // 🚀 AMBIL SEMUA DATA DETAIL UNTUK MASTER HUB
  async getAllChurchesForMaster() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, namaGereja, namaAdmin, email, subdomain, isVerified')
      .order('id', { ascending: false });
    if (error) throw new BadRequestException('Gagal mengambil data master.');
    return data;
  }

  async getProfile(userId: number) {
    const supabase = this.supabaseService.getClient();
    const { data: user, error } = await supabase.from('users').select('id, namaGereja, namaAdmin, email').eq('id', userId).single();
    if (error || !user) throw new UnauthorizedException('Pengguna tidak ditemukan');
    return user;
  }
}