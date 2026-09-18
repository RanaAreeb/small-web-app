import { Body, Controller, Delete, HttpCode, Param, Post } from '@nestjs/common';
import { CreateVisitDto } from './dto/create-visit.dto';
import { VisitsService } from './visits.service';

@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  create(@Body() dto: CreateVisitDto) {
    return this.visitsService.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.visitsService.remove(id);
  }
}
