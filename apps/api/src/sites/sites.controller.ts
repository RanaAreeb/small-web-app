import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateSiteDto } from './dto/create-site.dto';
import { SitesService } from './sites.service';

@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  publish(@Body() dto: CreateSiteDto) {
    return this.sitesService.publish(dto);
  }

  @Get(':address')
  resolve(@Param('address') address: string) {
    return this.sitesService.resolve(address);
  }
}
