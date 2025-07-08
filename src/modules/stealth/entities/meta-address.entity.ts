import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from 'src/modules/users/entities/user.entity';

import { StealthAddress } from './stealth-address.entity';

@Entity('meta_addresses')
export class MetaAddress {
  @PrimaryGeneratedColumn('uuid')
  metaId: string;

  @ManyToOne(() => User, (user) => user.metaAddresses)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 64 })
  scanPublic: string;

  @Column({ length: 64 })
  spendPublic: string;

  @Column('text')
  scanPrivateEncrypted: string;

  @Column('text')
  spendPrivateEncrypted: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => StealthAddress, (stealth) => stealth.metaAddress)
  stealthAddresses: StealthAddress[];
}
