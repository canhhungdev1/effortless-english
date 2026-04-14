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

  async getAllWords(userId: string) {
    return this.prisma.userVocabulary.findMany({
      where: { user_id: userId },
      orderBy: { next_review: 'asc' }
    });
  }

  async addToFlashcards(userId: string, data: any) {
    return this.prisma.userVocabulary.upsert({
      where: { user_id_word: { user_id: userId, word: data.word } },
      update: {
        translation: data.translation,
        phonetic: data.phonetic,
        audio: data.audio,
        example: data.example,
        next_review: new Date() // Reset to study immediately
      },
      create: {
        user_id: userId,
        word: data.word,
        translation: data.translation,
        phonetic: data.phonetic,
        audio: data.audio,
        example: data.example
      }
    });
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
}
