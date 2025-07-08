import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { StealthAddress } from './stealth-address.entity';

@Entity('ephemeral_keys')
export class EphemeralKey {
  @PrimaryGeneratedColumn('uuid')
  ephId: string;

  @ManyToOne(() => StealthAddress, (stealth) => stealth.ephemeralKeys)
  @JoinColumn({ name: 'stealth_id' })
  stealthAddress: StealthAddress;

  @Column({ length: 64 })
  ephemeralKey: string;

  @Column({ length: 66 })
  txHash: string;

  @Column('bigint')
  blockHeight: number;

  @CreateDateColumn({ type: 'timestamp' })
  seenAt: Date;
}
