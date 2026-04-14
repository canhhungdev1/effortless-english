import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [courseCount, lessonCount, contentCount] = await Promise.all([
      this.prisma.course.count(),
      this.prisma.lesson.count(),
      this.prisma.lessonContent.count(),
    ]);

    const recentLessons = await this.prisma.lesson.findMany({
      take: 5,
      orderBy: { updated_at: 'desc' },
      include: { course: true }
    });

    return {
      stats: {
        courses: courseCount,
        lessons: lessonCount,
        contents: contentCount
      },
      recentLessons: recentLessons.map(l => ({
        id: l.id,
        title: l.title,
        courseTitle: l.course.title,
        courseId: l.course_id,
        updatedAt: l.updated_at
      }))
    };
  }
}
