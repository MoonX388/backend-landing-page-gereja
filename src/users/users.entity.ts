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

  @Column({ default: false })
  isVerified: boolean;

  // 🚀 PERBAIKAN: Wajib tambahkan | null agar bisa dikosongkan setelah dipakai
  @Column({ nullable: true })
  verificationToken: string | null; 

  @Column({ nullable: true })
  resetPasswordToken: string | null;

  @Column({ nullable: true, type: 'simple-json' })
  resetPasswordExpires: Date | null;
}
