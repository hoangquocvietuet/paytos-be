import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '../../common/base.schema';

@Schema({ timestamps: true })
export class User extends BaseSchema {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true, unique: true })
  walletAddress: string;

  @Prop({ required: true })
  username: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
