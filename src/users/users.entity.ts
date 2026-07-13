// server_side/src/auth/users.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  namaGereja: string;

  @Column()
  namaAdmin: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  // 🚀 Tambahkan kolom tracking autentikasi di bawah ini:
  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationToken: string;

  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({ nullable: true, type: 'simple-json' }) // Fleksibel untuk SQLite
  resetPasswordExpires: Date;
}
