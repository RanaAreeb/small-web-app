import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Person } from '../../people/schemas/person.schema';

export type SiteDocument = HydratedDocument<Site>;

@Schema({ timestamps: true, collection: 'sites' })
export class Site {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  address!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true })
  sanitizedHtml!: string;

  @Prop({ required: true })
  searchableText!: string;

  @Prop({ type: Types.ObjectId, ref: Person.name, required: true, index: true })
  authorId!: Types.ObjectId;

  @Prop({ unique: true, sparse: true, trim: true })
  seedKey?: string;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

SiteSchema.index(
  { title: 'text', searchableText: 'text' },
  {
    weights: {
      title: 10,
      searchableText: 5,
    },
    name: 'site_text_search',
  },
);
