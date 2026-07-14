// server_side/src/auth/email.service.ts
// server_side/src/auth/email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    // Inisialisasi transporter dengan variabel environment dari Railway
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.gerejapintar.id',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: process.env.SMTP_PORT === '465', // Otomatis true jika port 465, false jika 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // Bypass pengecekan sertifikat SSL jika mail hosting bersifat lokal/self-signed
        rejectUnauthorized: false,
      },
    });

    // 🚀 KAMERA PENGINTAI 1: Validasi koneksi SMTP langsung saat server NestJS booting
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ [SMTP CONNECTION FAILED] Koneksi ke cPanel gagal:', error.message);
      } else {
        console.log('✅ [SMTP CONNECTION SUCCESS] Server SMTP siap mengirim email dari Railway!');
      }
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const baseUrl = process.env.FRONTEND_URL || 'https://gerejapintar.id';
    const url = `${baseUrl}/verify-email?token=${token}`;
    
    try {
      console.log(`[EmailService] Mencoba mengirim email verifikasi ke target: ${to}`);
      
      await this.transporter.sendMail({
        from: `"Gereja Pintar" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Verifikasi Akun Administrator Anda - Gereja Pintar',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Selamat Datang di Gereja Pintar!</h2>
            <p>Akun administrator Anda berhasil dibuat. Silakan klik tombol di bawah ini untuk memverifikasi email Anda:</p>
            <p style="margin: 25px 0;">
              <a href="${url}" target="_blank" style="padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verifikasi Email Sekarang</a>
            </p>
            <p style="font-size: 12px; color: #666;">Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:<br>${url}</p>
          </div>
        `,
      });
      
      // 🚀 KAMERA PENGINTAI 2: Log sukses jika email berhasil diserahkan ke cPanel
      console.log(`✅ [EMAIL SENT] Email verifikasi sukses dikirim ke: ${to}`);
    } catch (error) {
      console.error(`❌ [EMAIL ERROR] Gagal mengirim email ke ${to}. Detail eror:`, error);
      throw error;
    }
  }

  async sendResetPasswordEmail(to: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/reset-pwd?token=${token}`;
    await this.transporter.sendMail({
      from: `"Gereja Pintar Support" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Permintaan Reset Kata Sandi Akun Anda',
      html: `
        <h3>Permintaan Reset Kata Sandi</h3>
        <p>Kami menerima permintaan untuk mereset kata sandi akun Anda. Klik tombol di bawah ini untuk melanjutkan:</p>
        <a href="${url}" target="_blank" style="padding: 10px 20px; background-color: #e0556a; color: white; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">Atur Ulang Kata Sandi</a>
        <br/><br/>
        <p>Tautan ini akan kedaluwarsa dalam waktu 1 jam.</p>
        <p>Jika Anda tidak meminta ini, abaikan email ini secara aman.</p>
      `,
    });
  }
}
