import { BadRequestException } from '@nestjs/common';
import {
  decodeHistoryCursor,
  encodeHistoryCursor,
} from './history-cursor';

describe('history cursor', () => {
  it('round-trips visitedAt and id', () => {
    const visitedAt = new Date('2026-01-15T12:00:00.000Z');
    const id = '507f1f77bcf86cd799439011';

    const encoded = encodeHistoryCursor(visitedAt, id);
    const decoded = decodeHistoryCursor(encoded);

    expect(decoded.id).toBe(id);
    expect(decoded.visitedAt.toISOString()).toBe(visitedAt.toISOString());
  });

  it('rejects an invalid cursor', () => {
    expect(() => decodeHistoryCursor('not-valid')).toThrow(BadRequestException);
  });
});
