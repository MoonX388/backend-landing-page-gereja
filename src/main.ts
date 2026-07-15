// server_side/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. PERBAIKAN CORS DINAMIS: Mengizinkan semua subdomain gerejapintar.id otomatis
  app.enableCors({
    origin: (origin, callback) => {
      // Izinkan jika akses dari Postman/Backend langsung (!origin) 
      // Atau domain utama & subdomain (*.gerejapintar.id)
      // Atau lokal testing di laptop (localhost)
      if (
        !origin || 
        origin === process.env.FRONTEND_URL || 
        origin.endsWith('.' + process.env.FRONTEND_URL) || 
        origin.includes('localhost:')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Akses diblokir oleh kebijakan CORS Gereja Pintar'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2. PERBAIKAN PORT & HOST BINDING: Wajib tambahkan '0.0.0.0' untuk Railway!
  const port = process.env.PORT || 8080;
  await app.listen(port, process.env.FRONTEND_URL || '0.0.0.0');
  
  console.log(`Application is successfully running on port: ${port}`);
}
bootstrap();
