import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async findAll(courseIdOrSlug: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: {
        course: {
          OR: [
            { id: courseIdOrSlug },
            { slug: courseIdOrSlug }
          ]
        }
      },
      orderBy: { order: 'asc' },
    });

    return lessons.map(lesson => ({
      id: lesson.id,
      slug: lesson.slug,
      courseId: lesson.course_id,
      order: lesson.order,
      title: lesson.title,
      progress: lesson.progress,
    }));
  }

  async findOne(courseIdOrSlug: string, idOrSlug: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        AND: [
          { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
          { course: { OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }] } }
        ]
      },
      include: {
        contents: true,
      },
    });

    if (!lesson) return null;

    const result: any = {
      id: lesson.id,
      slug: lesson.slug,
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

  async create(courseId: string, data: any) {
    return this.prisma.lesson.create({
      data: {
        course_id: courseId,
        slug: data.slug,
        title: data.title,
        order: data.order || 0,
        progress: 0,
      }
    });
  }

  async update(id: string, data: any) {
    return this.prisma.lesson.update({
      where: { id },
      data: {
        slug: data.slug,
        title: data.title,
        order: data.order,
      }
    });
  }

  async remove(id: string) {
    return this.prisma.lesson.delete({
      where: { id }
    });
  }

  async upsertContent(lessonId: string, type: string, data: any) {
    console.log(`Upserting content for lesson ${lessonId}, type ${type}`, data);
    // For single-instance types (ARTICLE, VOCABULARY), we use the old logic
    const singleInstanceTypes = ['ARTICLE', 'VOCABULARY'];
    
    if (singleInstanceTypes.includes(type)) {
      const existing = await this.prisma.lessonContent.findFirst({
        where: { lesson_id: lessonId, type }
      });

      if (existing) {
        return this.prisma.lessonContent.update({
          where: { id: existing.id },
          data: {
            title: data.title,
            audio_url: data.audioUrl,
            vtt_url: data.vttUrl,
            content_en: data.contentEn,
            content_vi: data.contentVi,
            data: data.extraData || {},
          }
        });
      }
    }

    // For multi-instance types or new single-instance
    if (data.id) {
      return this.prisma.lessonContent.update({
        where: { id: data.id },
        data: {
          title: data.title,
          audio_url: data.audioUrl,
          vtt_url: data.vttUrl,
          content_en: data.contentEn,
          content_vi: data.contentVi,
          data: data.extraData || {},
        }
      });
    }

    return this.prisma.lessonContent.create({
      data: {
        lesson_id: lessonId,
        type,
        title: data.title,
        audio_url: data.audioUrl,
        vtt_url: data.vttUrl,
        content_en: data.contentEn,
        content_vi: data.contentVi,
        data: data.extraData || {},
      }
    });
  }

  async removeContent(id: string) {
    return this.prisma.lessonContent.delete({
      where: { id }
    });
  }

  async reorder(lessons: { id: string; order: number }[]) {
    return this.prisma.$transaction(
      lessons.map((lesson) =>
        this.prisma.lesson.update({
          where: { id: lesson.id },
          data: { order: lesson.order },
        }),
      ),
    );
  }
}
