import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class FlashcardsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService
  ) {}

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

    // Generate 7-day forecast (Daily New Due counts)
    const forecast: { date: string, count: number }[] = [];
    for (let i = 0; i < 7; i++) {
        const start = new Date(now);
        start.setDate(start.getDate() + i);
        if (i > 0) start.setHours(0, 0, 0, 0); // Start of the day for future days
        
        const end = new Date(start);
        end.setHours(23, 59, 59, 999); // End of the day

        const count = await this.prisma.userVocabulary.count({
            where: {
                user_id: userId,
                next_review: {
                    gte: i === 0 ? new Date(0) : start, // Include overdue words only in Day 0
                    lte: end
                }
            }
        });
        forecast.push({
            date: end.toISOString().split('T')[0],
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

  async getStudyStats(userId: string) {
    const history = await this.prisma.reviewHistory.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: { created_at: true }
    });

    if (history.length === 0) {
      return { streak: 0, heatmap: [] };
    }

    // Extract unique dates (YYYY-MM-DD)
    const dates = [...new Set(history.map(h => h.created_at.toISOString().split('T')[0]))];

    // Calculate streak
    let streak = 0;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if user studied today or yesterday to start the streak
    let checkDateStr = dates.includes(today) ? today : (dates.includes(yesterdayStr) ? yesterdayStr : null);

    if (checkDateStr) {
      const checkDatesSet = new Set(dates);
      let currentCheck = new Date(checkDateStr);
      
      while (checkDatesSet.has(currentCheck.toISOString().split('T')[0])) {
        streak++;
        currentCheck.setDate(currentCheck.getDate() - 1);
      }
    }

    // Heatmap data: Group by date and count
    const heatmapData = await this.prisma.reviewHistory.groupBy({
      by: ['created_at'],
      where: { user_id: userId },
      _count: { _all: true },
    });

    // Since groupBy on created_at (DateTime) gives granular results, we aggregate manually for days
    const dailyMap: Record<string, number> = {};
    history.forEach(h => {
        const d = h.created_at.toISOString().split('T')[0];
        dailyMap[d] = (dailyMap[d] || 0) + 1;
    });

    const heatmap = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

    return { 
      streak, 
      heatmap,
      todayCount: history.filter(h => h.created_at.toISOString().split('T')[0] === today).length
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
    } else if (rating === 1) { // Hard
      repetitions = 0;
      interval = 1;
    } else { // Again
      repetitions = 0;
      interval = 0;
    }

    // Update Ease Factor (Simplified SM-2)
    const mapped = rating === 0 ? 0 : (rating === 1 ? 2 : (rating === 2 ? 4 : 5));
    ease_factor = ease_factor + (0.1 - (5 - mapped) * (0.08 + (5 - mapped) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;

    const next_review = new Date();
    next_review.setDate(next_review.getDate() + interval);

    // Log to history
    await this.prisma.reviewHistory.create({
      data: {
        user_id: word.user_id,
        vocabulary_id: id,
        rating: rating,
      }
    });

    // Update User XP & Streak (Reward 5 XP per word)
    await this.usersService.addXp(word.user_id, 5);

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
