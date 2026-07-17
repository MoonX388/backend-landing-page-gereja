import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { TypeOrmModule } from '@nestjs/typeorm'; // 🔌 Dimatikan sementara
import { JwtModule } from '@nestjs/jwt';
// import { User } from './users/users.entity'; // 🔌 Dimatikan sementara
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { EmailService } from './auth/email.service';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    /* 🚀 VARIABEL DATABASE DIMATIKAN TOTAL SEMENTARA PAS MIGRASI
    TypeOrmModule.forRoot({
      type: (process.env.DB_TYPE as any) || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'gereja_pintar',
      entities: [User], 
      synchronize: true, 
    }),
    TypeOrmModule.forFeature([User]),
    */

    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'SUPER_SECRET_KEY_GEREJA_PINTAR', // Kunci rahasia token
      signOptions: { expiresIn: '1d' }, // Token hangus dalam 1 hari
    }),
    SupabaseModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailService, 
  ],
})
export class AppModule {}