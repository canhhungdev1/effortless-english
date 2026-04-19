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
      orderBy: { order: 'asc' }
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
      order: course.order,
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
      order: course.order,
      lessonCount: course._count.lessons
    };

  }

  async create(data: any) {
    return this.prisma.course.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        level: data.level,
        cover_image: data.coverImage,
        is_vip: data.isVip,
        stage: data.stage || 1,
        order: data.order || 0,
      }
    });

  }

  async update(id: string, data: any) {
    return this.prisma.course.update({
      where: { id },
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        level: data.level,
        cover_image: data.coverImage,
        is_vip: data.isVip,
        stage: data.stage,
        order: data.order,
      }
    });

  }

  async remove(id: string) {
    return this.prisma.course.delete({
      where: { id }
    });
  }
  async reorder(items: { id: string; order: number }[]) {
    console.log('[CoursesService] Reordering courses:', items);
    const results = await Promise.all(
      items.map(item => 
        this.prisma.course.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );
    console.log('[CoursesService] Reorder complete');
    return results;
  }

}

