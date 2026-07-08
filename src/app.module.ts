import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './users/users.entity';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'gereja_pintar',
      entities: [User], // Masukkan entitas User ke sini
      synchronize: true, // Otomatis membuat tabel 'users' di Postgres jika belum ada
    }),
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'SUPER_SECRET_KEY_GEREJA_PINTAR', // Kunci rahasia token
      signOptions: { expiresIn: '1d' }, // Token hangus dalam 1 hari
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AppModule {}