// server_side/src/auth/auth.controller.ts
import { Controller, Post, Get, Body, Headers, Query, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  // 🚀 Tambahan Rute 1: Verifikasi Email dari klik URL tautan
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  // 🚀 Tambahan Rute 2: Mengirim permintaan tautan lupa sandi
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  // 🚀 Tambahan Rute 3: Eksekusi pengubahan sandi baru
  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    return this.authService.resetPassword(body);
  }

  @Get('me')
  async getMe(@Headers('authorization') authHeader: string) {
    if (!authHeader) throw new UnauthorizedException('Token tidak ditemukan');
    try {
      const token = authHeader.split(' ')[1];
      const decoded = this.jwtService.verify(token);
      return this.authService.getProfile(decoded.id);
    } catch {
      throw new UnauthorizedException('Sesi kadaluwarsa, silakan login kembali');
    }
  }
}
