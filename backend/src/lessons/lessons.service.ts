import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async findAll(courseId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { course_id: courseId },
      orderBy: { order: 'asc' },
    });

    return lessons.map(lesson => ({
      id: lesson.id,
      courseId: lesson.course_id,
      order: lesson.order,
      title: lesson.title,
      progress: lesson.progress,
    }));
  }

  async findOne(courseId: string, id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        contents: true,
      },
    });

    if (!lesson || lesson.course_id !== courseId) return null;

    const result: any = {
      id: lesson.id,
      courseId: lesson.course_id,
      order: lesson.order,
      title: lesson.title,
      progress: lesson.progress,
      miniStories: [],
      pointOfViews: [],
      commentaries: []
    };

    // Map contents back to the structure expected by the frontend
    lesson.contents.forEach(content => {
      const type = content.type;
      const data: any = content.data || {};

      switch (type) {
        case 'ARTICLE':
          result.mainArticle = {
            audioUrl: content.audio_url,
            englishText: content.content_en,
            vietnameseText: content.content_vi
          };
          break;
        case 'VOCABULARY':
          result.vocabulary = {
            audioUrl: content.audio_url,
            vttUrl: content.vtt_url,
            paragraphs: data.paragraphs || [],
            keywords: data.keywords || []
          };
          break;
        case 'MINI_STORY':
          result.miniStories.push({
            title: content.title || 'Mini-Story',
            audioUrl: content.audio_url,
            vttUrl: content.vtt_url,
            lines: data.lines || []
          });
          break;
        case 'POINT_OF_VIEW':
          result.pointOfViews.push({
            title: content.title || 'Point of View',
            audioUrl: content.audio_url,
            vttUrl: content.vtt_url,
            lines: data.lines || []
          });
          break;
        case 'COMMENTARY':
          result.commentaries.push({
            title: content.title || 'Commentary',
            audioUrl: content.audio_url,
            vttUrl: content.vtt_url,
            lines: data.lines || []
          });
          break;
      }
    });

    return result;
  }
}
