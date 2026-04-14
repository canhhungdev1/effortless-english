import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('api/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.coursesService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.coursesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}
