import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/users.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // Logika Register
  async register(body: any) {
    const { namaGereja, namaAdmin, email, password } = body;

    // Cek apakah email sudah terdaftar
    const userExists = await this.userRepository.findOne({ where: { email } });
    if (userExists) {
      throw new BadRequestException('Email ini sudah terdaftar!');
    }

    // Hash password agar aman di database
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      namaGereja,
      namaAdmin,
      email,
      password: hashedPassword,
    });

    await this.userRepository.save(newUser);
    return { message: 'Registrasi berhasil!' };
  }

  // Logika Login
  async login(body: any) {
    const { username, password } = body; // 'username' dari frontend bisa berupa email

    // Cari user berdasarkan email
    const user = await this.userRepository.findOne({ where: { email: username } });
    if (!user) {
      throw new UnauthorizedException('Email atau kata sandi salah.');
    }

    // Cocokkan password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Email atau kata sandi salah.');
    }

    // Buat JWT Token
    const payload = { id: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    // Kembalikan data sesuai kebutuhan frontend
    return {
      token,
      user: {
        id: user.id,
        namaGereja: user.namaGereja,
        namaAdmin: user.namaAdmin,
        email: user.email,
      },
    };
  }

  // Ambil data profil berdasarkan Token JWT
  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    
    return {
      id: user.id,
      namaGereja: user.namaGereja,
      namaAdmin: user.namaAdmin,
      email: user.email,
    };
  }
}