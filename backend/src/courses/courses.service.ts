import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const courses = await this.prisma.course.findMany({
      include: {
        _count: {
          select: { lessons: true }
        }
      },
      orderBy: { stage: 'asc' }
    });

    return courses.map(course => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      level: course.level,
      coverImage: course.cover_image,
      isVip: course.is_vip,
      stage: course.stage,
      lessonCount: course._count.lessons
    }));
  }

  async findOne(idOrSlug: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      },
      include: {
        _count: {
          select: { lessons: true }
        }
      }
    });

    if (!course) return null;

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      level: course.level,
      coverImage: course.cover_image,
      isVip: course.is_vip,
      stage: course.stage,
      lessonCount: course._count.lessons
    };
  }
}
