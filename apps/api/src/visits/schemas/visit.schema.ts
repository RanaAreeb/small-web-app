import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Person } from '../../people/schemas/person.schema';
import { Site } from '../../sites/schemas/site.schema';
import { VisitOutcome, VisitVia } from '../visit.enums';

export type VisitDocument = HydratedDocument<Visit>;

@Schema({ timestamps: false, collection: 'visits' })
export class Visit {
  @Prop({ type: Types.ObjectId, ref: Person.name, required: true })
  personId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Site.name, required: false })
  siteId?: Types.ObjectId;

  @Prop({ required: true, trim: true, lowercase: true })
  address!: string;

  @Prop({
    required: true,
    enum: Object.values(VisitOutcome),
    type: String,
  })
  outcome!: VisitOutcome;

  @Prop({
    required: true,
    enum: Object.values(VisitVia),
    type: String,
  })
  via!: VisitVia;

  @Prop({ required: true, type: Date })
  visitedAt!: Date;

  @Prop({ unique: true, sparse: true, trim: true })
  seedKey?: string;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);

VisitSchema.index(
  { personId: 1, visitedAt: -1, _id: -1 },
  { name: 'visits_person_timeline' },
);
