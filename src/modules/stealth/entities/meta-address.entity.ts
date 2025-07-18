import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity.js';

import { StealthAddress } from './stealth-address.entity';

@Entity('meta_addresses')
export class MetaAddress {
  @PrimaryGeneratedColumn('uuid')
  metaId: string;

  @ManyToOne(() => User, (user) => user.metaAddresses)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 255 })
  scanPublic: string;

  @Column({ length: 255 })
  spendPublic: string;

  @Column('text')
  scanPrivateEncrypted: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => StealthAddress, (stealth) => stealth.metaAddress, {
    cascade: true, // This ensures stealth addresses are deleted when meta-address is deleted
    onDelete: 'CASCADE',
  })
  stealthAddresses: StealthAddress[];
}
