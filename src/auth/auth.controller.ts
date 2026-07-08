import { Controller, Post, Get, Body, Headers, UnauthorizedException } from '@nestjs/common';
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

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Get('me')
  async getMe(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }

    try {
      const token = authHeader.split(' ')[1]; // Mengambil string token setelah 'Bearer '
      const decoded = this.jwtService.verify(token);
      return this.authService.getProfile(decoded.id);
    } catch {
      throw new UnauthorizedException('Sesi kadaluwarsa, silakan login kembali');
    }
  }
}