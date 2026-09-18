import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PersonDocument = HydratedDocument<Person>;

@Schema({ timestamps: true, collection: 'people' })
export class Person {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug!: string;

  @Prop({ unique: true, sparse: true, trim: true })
  seedKey?: string;
}

export const PersonSchema = SchemaFactory.createForClass(Person);
