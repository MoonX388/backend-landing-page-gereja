// server_side/src/auth/email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.gerejapintar.id',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: true, // 🚀 WAJIB true untuk Port 465 sesuai petunjuk cPanel
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Mengantisipasi jika sertifikat SSL lokal mail server menolak ketukan domain luar
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await this.transporter.sendMail({
      from: `"Gereja Pintar Support" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Verifikasi Akun Gereja Pintar Anda',
      html: `
        <h3>Selamat Datang di Gereja Pintar!</h3>
        <p>Silakan klik tautan di bawah ini untuk memverifikasi alamat email akun Anda:</p>
        <a href="${url}" target="_blank" style="padding: 10px 20px; background-color: #e8c547; color: #0f1a2e; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">Verifikasi Email Sekarang</a>
        <br/><br/>
        <p>Jika tautan di atas tidak bekerja, salin URL berikut ke browser Anda:</p>
        <p>${url}</p>
      `,
    });
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
