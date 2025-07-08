import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StealthAddress } from './stealth-address.entity';

export enum Direction {
  IN = 'IN',
  OUT = 'OUT',
}

export enum AssetType {
  COIN = 'coin',
  FT = 'ft',
  NFT = 'nft',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  txId: string;

  @ManyToOne(() => StealthAddress, (stealth) => stealth.transactions)
  @JoinColumn({ name: 'stealth_id' })
  stealthAddress: StealthAddress;

  @Column({ length: 66 })
  txHash: string;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ type: 'enum', enum: Direction })
  direction: Direction;

  @Column({ type: 'enum', enum: AssetType })
  assetType: AssetType;

  @Column({ type: 'text', nullable: true })
  tokenAddress: string;

  @Column({ type: 'text', nullable: true })
  tokenId: string;

  @Column({ type: 'numeric', nullable: true })
  amount: number;
}
