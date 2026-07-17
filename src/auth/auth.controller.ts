import { Controller, Post, Get, Body, Headers, Query, Param, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService, 
  ) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    return this.authService.resetPassword(body);
  }

  @Get('check-subdomain/:subdomain')
  async checkSubdomain(@Param('subdomain') subdomain: string) {
    const result = await this.authService.checkSubdomainValid(subdomain);
    if (!result.valid) {
      throw new BadRequestException('Subdomain tidak terdaftar!');
    }
    return result;
  }

  @Get('public-churches')
  async getPublicChurches() {
    return await this.authService.getAllPublicChurches();
  }

  // 🚀 HUB KONEKSI MASTER ADMIN: Menarik data lengkap semua gereja untuk panel pusat
  @Get('master/churches')
  async getMasterChurches(@Headers('authorization') authHeader: string) {
    if (!authHeader) throw new UnauthorizedException('Token otoritas tidak ditemukan');
    try {
      const token = authHeader.split(' ')[1];
      this.jwtService.verify(token); // Validasi token admin sebelum memberi data sensitif
      return await this.authService.getAllChurchesForMaster();
    } catch {
      throw new UnauthorizedException('Sesi verifikasi gagal.');
    }
  }

  @Get('me')
  async getMe(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }

    try {
      const token = authHeader.split(' ')[1];
      
      // 1. Verifikasi token menggunakan JWT global
      const decoded = this.jwtService.verify(token); 
      
      // 2. Langsung ambil profil dari authService (ini yang benar)
      return this.authService.getProfile(decoded.id);
      
    } catch (err: any) {
      console.error('❌ [JWT VERIFY ERROR] Detail:', err.message);
      throw new UnauthorizedException('Sesi kadaluwarsa, silakan login kembali');
    }
  }
}