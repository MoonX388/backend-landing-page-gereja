// server_side/src/auth/users.entity.ts (atau src/users/users.entity.ts)

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

  // 🚀 PERBAIKAN 1: Tambahkan type: 'varchar'
  @Column({ type: 'varchar', nullable: true })
  verificationToken: string | null; 

  // 🚀 PERBAIKAN 2: Tambahkan type: 'varchar'
  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken: string | null;

  // 🚀 PERBAIKAN 3: Ubah menjadi type: 'timestamp' (sangat cocok untuk PostgreSQL & SQLite)
  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires: Date | null;
}
