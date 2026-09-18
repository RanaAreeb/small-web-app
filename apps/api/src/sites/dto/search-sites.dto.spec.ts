import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SearchSitesDto } from './search-sites.dto';

describe('SearchSitesDto', () => {
  async function validateQuery(input: Record<string, unknown>) {
    const dto = plainToInstance(SearchSitesDto, input);
    return validate(dto);
  }

  it('rejects a missing query', async () => {
    const errors = await validateQuery({ limit: 10 });
    expect(errors.some((error) => error.property === 'q')).toBe(true);
  });

  it('rejects an empty query', async () => {
    const errors = await validateQuery({ q: '' });
    expect(errors.some((error) => error.property === 'q')).toBe(true);
  });

  it('rejects a whitespace-only query', async () => {
    const errors = await validateQuery({ q: '   ' });
    expect(errors.some((error) => error.property === 'q')).toBe(true);
  });

  it('accepts a valid query with defaultable limit', async () => {
    const errors = await validateQuery({ q: 'garden' });
    expect(errors).toHaveLength(0);
  });

  it('rejects a limit above 50', async () => {
    const errors = await validateQuery({ q: 'garden', limit: 51 });
    expect(errors.some((error) => error.property === 'limit')).toBe(true);
  });

  it('rejects a non-positive limit', async () => {
    const errors = await validateQuery({ q: 'garden', limit: 0 });
    expect(errors.some((error) => error.property === 'limit')).toBe(true);
  });

  it('accepts limit at the cap of 50', async () => {
    const errors = await validateQuery({ q: 'garden', limit: 50 });
    expect(errors).toHaveLength(0);
  });
});
