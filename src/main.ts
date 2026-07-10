import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. MASALAH CORS: Tentukan domain spesifik jika pakai credentials: true
  app.enableCors({
    origin: [
      'https://gerejapintar.id', // Domain frontend kamu
      'http://localhost:3000'    // Biar tetep bisa ditest di laptop sendiri
    ], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2. MASALAH PORT: Gunakan port dari Railway atau default 3000
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();