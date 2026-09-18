import { Controller, Get, Query } from '@nestjs/common';
import { SearchSitesDto } from './dto/search-sites.dto';
import { SitesService } from './sites.service';

@Controller('search')
export class SearchController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  search(@Query() query: SearchSitesDto) {
    const limit = query.limit ?? 20;
    return this.sitesService.search(query.q, limit);
  }
}
