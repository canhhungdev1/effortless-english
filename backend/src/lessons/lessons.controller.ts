import { Controller, Get, Param } from '@nestjs/common';
import { LessonsService } from './lessons.service';

@Controller('api/lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get(':courseId')
  findAll(@Param('courseId') courseId: string) {
    return this.lessonsService.findAll(courseId);
  }

  @Get(':courseId/:id')
  findOne(@Param('courseId') courseId: string, @Param('id') id: string) {
    return this.lessonsService.findOne(courseId, id);
  }
}
