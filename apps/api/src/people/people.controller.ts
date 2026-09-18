import { Controller, Get, Param, Query } from '@nestjs/common';
import { HistoryQueryDto } from '../visits/dto/history-query.dto';
import { VisitsService } from '../visits/visits.service';
import { PeopleService } from './people.service';

@Controller('people')
export class PeopleController {
  constructor(
    private readonly peopleService: PeopleService,
    private readonly visitsService: VisitsService,
  ) {}

  @Get()
  list() {
    return this.peopleService.list();
  }

  @Get(':personId/history')
  history(
    @Param('personId') personId: string,
    @Query() query: HistoryQueryDto,
  ) {
    const limit = query.limit ?? 30;
    return this.visitsService.getHistory(personId, query.cursor, limit);
  }
}
