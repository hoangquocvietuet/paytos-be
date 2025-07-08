import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { MetaAddress } from './meta-address.entity';
import { EphemeralKey } from './ephemeral-key.entity';
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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => EphemeralKey, (eph) => eph.stealthAddress)
  ephemeralKeys: EphemeralKey[];

  @OneToMany(() => Transaction, (tx) => tx.stealthAddress)
  transactions: Transaction[];
}
