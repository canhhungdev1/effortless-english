import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}
  
  @Post('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  reorder(@Body() lessons: { id: string; order: number }[]) {
    return this.lessonsService.reorder(lessons);
  }

  @Get(':courseId')
  findAll(@Param('courseId') courseId: string) {
    return this.lessonsService.findAll(courseId);
  }

  @Get(':courseId/:id')
  findOne(@Param('courseId') courseId: string, @Param('id') id: string) {
    return this.lessonsService.findOne(courseId, id);
  }

  @Post(':courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Param('courseId') courseId: string, @Body() data: any) {
    return this.lessonsService.create(courseId, data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() data: any) {
    return this.lessonsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.lessonsService.remove(id);
  }

  @Post(':id/content/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  upsertContent(
    @Param('id') id: string,
    @Param('type') type: string,
    @Body() data: any
  ) {
    return this.lessonsService.upsertContent(id, type, data);
  }

  @Delete('content/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  removeContent(@Param('id') id: string) {
    return this.lessonsService.removeContent(id);
  }
}
