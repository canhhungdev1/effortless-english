import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
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

  @Post(':courseId')
  create(@Param('courseId') courseId: string, @Body() data: any) {
    return this.lessonsService.create(courseId, data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.lessonsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lessonsService.remove(id);
  }

  @Post(':id/content/:type')
  upsertContent(
    @Param('id') id: string,
    @Param('type') type: string,
    @Body() data: any
  ) {
    return this.lessonsService.upsertContent(id, type, data);
  }

  @Delete('content/:id')
  removeContent(@Param('id') id: string) {
    return this.lessonsService.removeContent(id);
  }
}
