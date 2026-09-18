import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

export type HistoryCursor = {
  visitedAt: Date;
  id: string;
};

export function encodeHistoryCursor(visitedAt: Date, id: string): string {
  const payload = JSON.stringify({
    visitedAt: visitedAt.toISOString(),
    id,
  });
  return Buffer.from(payload, 'utf8').toString('base64url');
}

export function decodeHistoryCursor(cursor: string): HistoryCursor {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as { visitedAt?: unknown; id?: unknown };

    if (
      typeof parsed.visitedAt !== 'string' ||
      typeof parsed.id !== 'string' ||
      !Types.ObjectId.isValid(parsed.id)
    ) {
      throw new Error('invalid cursor shape');
    }

    const visitedAt = new Date(parsed.visitedAt);
    if (Number.isNaN(visitedAt.getTime())) {
      throw new Error('invalid visitedAt');
    }

    return { visitedAt, id: parsed.id };
  } catch {
    throw new BadRequestException('Invalid history cursor');
  }
}
