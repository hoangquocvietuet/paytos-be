import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '../../common/base.schema.js';

@Schema({ timestamps: true })
export class User extends BaseSchema {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  publicKeyHex: string;

  @Prop({ required: true, unique: true })
  sendPublicKey: string;

  @Prop({ required: true, unique: true })
  viewPrivateKey: string;

  @Prop({ required: true, unique: true })
  viewPublicKey: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
