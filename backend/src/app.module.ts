import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { CoursesModule } from './courses/courses.module';
import { LessonsModule } from './lessons/lessons.module';

@Module({
  imports: [PrismaModule, CoursesModule, LessonsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
