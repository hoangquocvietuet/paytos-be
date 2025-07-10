import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EphemeralKey } from './ephemeral-key.entity';
import { MetaAddress } from './meta-address.entity';
import { Transaction } from './transaction.entity';

@Entity('stealth_addresses')
export class StealthAddress {
  @PrimaryGeneratedColumn('uuid')
  stealthId: string;

  @ManyToOne(() => MetaAddress, (meta) => meta.stealthAddresses)
  @JoinColumn({ name: 'meta_id' })
  metaAddress: MetaAddress;

  @Column({ length: 64, unique: true })
  address: string;

  @Column({ type: 'smallint', nullable: true })
  viewTag: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => EphemeralKey, (eph) => eph.stealthAddress, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  ephemeralKeys: EphemeralKey[];

  @OneToMany(() => Transaction, (tx) => tx.stealthAddress, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  transactions: Transaction[];
}
