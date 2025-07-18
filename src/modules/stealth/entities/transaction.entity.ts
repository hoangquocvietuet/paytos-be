import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
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
  @Column({ length: 255, primary: true })
  user_id: string;

  @Column({ length: 255, primary: true })
  sender_address: string;

  @Column({ length: 255, primary: true })
  stealth_address: string;

  @Column({ length: 255 })
  event_index: string;

  @Column({ type: 'numeric' })
  transaction_block_height: number;

  @Column({ type: 'enum', enum: Direction })
  direction: Direction;

  @Column({ type: 'text' })
  amount: string;
}
