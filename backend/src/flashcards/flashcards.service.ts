import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FlashcardsService {
  constructor(private prisma: PrismaService) {}

  async getDueWords(userId: string) {
    return this.prisma.userVocabulary.findMany({
      where: {
        user_id: userId,
        next_review: { lte: new Date() }
      },
      orderBy: { next_review: 'asc' }
    });
  }

  async getReviewStats(userId: string) {
    const now = new Date();
    const totalCount = await this.prisma.userVocabulary.count({
      where: { user_id: userId }
    });

    const dueCount = await this.prisma.userVocabulary.count({
      where: {
        user_id: userId,
        next_review: { lte: now }
      }
    });

    const masteredCount = await this.prisma.userVocabulary.count({
      where: {
        user_id: userId,
        interval: { gt: 30 }
      }
    });

    // Generate 7-day forecast
    const forecast: { date: string, count: number }[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        date.setHours(23, 59, 59, 999); // End of the day

        const count = await this.prisma.userVocabulary.count({
            where: {
                user_id: userId,
                next_review: { lte: date }
            }
        });
        forecast.push({
            date: date.toISOString().split('T')[0],
            count: count
        });
    }

    return {
      dueCount,
      totalCount,
      masteredCount,
      forecast
    };
  }

  async getAllWords(userId: string) {
    return this.prisma.userVocabulary.findMany({
      where: { user_id: userId },
      orderBy: { next_review: 'asc' }
    });
  }

  async addToFlashcards(userId: string, data: any) {
    const nextReview = data.next_review ? new Date(data.next_review) : new Date();
    
    return this.prisma.userVocabulary.upsert({
      where: { user_id_word: { user_id: userId, word: data.word } },
      update: {
        translation: data.translation,
        phonetic: data.phonetic,
        audio: data.audio,
        example: data.example,
        is_favorite: data.is_favorite ?? true,
        next_review: nextReview
      },
      create: {
        user_id: userId,
        word: data.word,
        translation: data.translation,
        phonetic: data.phonetic,
        audio: data.audio,
        example: data.example,
        is_favorite: data.is_favorite ?? true,
        next_review: nextReview
      }
    });
  }

  async syncFlashcards(userId: string, words: any[]) {
    // Perform bulk upserts
    const results: any[] = [];
    for (const data of words) {
      const result = await this.addToFlashcards(userId, data);
      results.push(result);
    }
    return results;
  }

  async toggleFavorite(userId: string, data: any) {
    const word = await this.prisma.userVocabulary.findUnique({
      where: { user_id_word: { user_id: userId, word: data.word } }
    });

    if (word) {
      return this.prisma.userVocabulary.update({
        where: { id: word.id },
        data: { is_favorite: !word.is_favorite }
      });
    } else {
      return this.addToFlashcards(userId, { ...data, is_favorite: true });
    }
  }

  async processReview(id: string, rating: number) {
    const word = await this.prisma.userVocabulary.findUnique({ where: { id } });
    if (!word) return null;

    let { interval, repetitions, ease_factor } = word as any;

    if (rating >= 2) { // Good or Easy (High rating)
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * ease_factor);
      }
      repetitions++;
    } else { // Hard or Again (Low rating)
      repetitions = 0;
      interval = 1;
    }

    // Update Ease Factor (Simplified SM-2)
    // Map our 0-3 rating to SM-2's 0-5
    // 0 (Again) -> 0
    // 1 (Hard) -> 2
    // 2 (Good) -> 4
    // 3 (Easy) -> 5
    const mapped = rating === 0 ? 0 : (rating === 1 ? 2 : (rating === 2 ? 4 : 5));
    ease_factor = ease_factor + (0.1 - (5 - mapped) * (0.08 + (5 - mapped) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;

    const next_review = new Date();
    next_review.setDate(next_review.getDate() + interval);

    return this.prisma.userVocabulary.update({
      where: { id },
      data: {
        interval,
        repetitions,
        ease_factor,
        next_review
      }
    });
  }

  async updateWord(id: string, data: any) {
    return this.prisma.userVocabulary.update({
      where: { id },
      data: {
        translation: data.translation,
        phonetic: data.phonetic,
        audio: data.audio,
        example: data.example
      }
    });
  }

  async deleteWord(id: string) {
    return this.prisma.userVocabulary.delete({
      where: { id }
    });
  }
}
