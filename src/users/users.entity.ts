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
}