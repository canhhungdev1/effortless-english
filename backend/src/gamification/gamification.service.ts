import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async trackActivity(userId: string, data: { xp?: number; seconds?: number; words?: number }) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Update Daily Stats
    const stats = await this.prisma.userDailyStat.upsert({
      where: {
        user_id_date: {
          user_id: userId,
          date: today,
        },
      },
      update: {
        xp_earned: { increment: data.xp || 0 },
        listening_time: { increment: data.seconds || 0 },
        words_learned: { increment: data.words || 0 },
      },
      create: {
        user_id: userId,
        date: today,
        xp_earned: data.xp || 0,
        listening_time: data.seconds || 0,
        words_learned: data.words || 0,
      },
    });

    // 2. Update User XP and Level if XP provided
    if (data.xp) {
      await this.usersService.addXp(userId, data.xp);
    }

    // 3. Check for new badges
    const newBadges = await this.checkAndAwardBadges(userId);

    return { stats, newBadges };
  }

  async getStats(userId: string) {
    const stats = await this.prisma.userDailyStat.findMany({
      where: { user_id: userId },
      orderBy: { date: 'asc' },
      take: 365, // Last year
    });

    // Get user streak and level
    const user = await this.usersService.user({ id: userId });

    return {
      history: stats,
      streak: user?.streak || 0,
      level: user?.level || 1,
      xp: user?.xp || 0,
    };
  }

  async getBadges(userId: string) {
    const allBadges = await this.prisma.badge.findMany();
    const userBadges = await this.prisma.userBadge.findMany({
      where: { user_id: userId },
      include: { badge: true },
    });

    const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id));

    return allBadges.map((badge) => ({
      ...badge,
      isEarned: earnedBadgeIds.has(badge.id),
      earnedAt: userBadges.find((ub) => ub.badge_id === badge.id)?.earned_at,
    }));
  }

  async checkAndAwardBadges(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        daily_stats: true,
        badges: true,
      },
    });

    if (!user) return [];

    const earnedBadgeCodes = new Set(user.badges.map((ub: any) => ub.badge_id)); // This is actually badge_id, better to check by code
    // Wait, badge_id is a UUID. I should fetch codes.
    const userBadgeRecords = await this.prisma.userBadge.findMany({
      where: { user_id: userId },
      include: { badge: true }
    });
    const currentBadgeCodes = new Set(userBadgeRecords.map(ub => ub.badge.code));

    const availableBadges = await this.prisma.badge.findMany();
    const newlyAwarded: any[] = [];

    // Calculate aggregate metrics
    const totalListeningSeconds = user.daily_stats.reduce((acc, curr) => acc + curr.listening_time, 0);
    const totalWordsLearned = user.daily_stats.reduce((acc, curr) => acc + curr.words_learned, 0);

    for (const badge of availableBadges) {
      if (currentBadgeCodes.has(badge.code)) continue;

      let qualified = false;
      switch (badge.requirement_type) {
        case 'STREAK':
          if (user.streak >= badge.requirement_value) qualified = true;
          break;
        case 'TIME':
          if (totalListeningSeconds >= badge.requirement_value) qualified = true; // value in seconds
          break;
        case 'VOCAB':
          if (totalWordsLearned >= badge.requirement_value) qualified = true;
          break;
      }

      if (qualified) {
        const awarded = await this.prisma.userBadge.create({
          data: {
            user_id: userId,
            badge_id: badge.id,
          },
          include: { badge: true },
        });
        newlyAwarded.push(awarded.badge);
        this.logger.log(`Awarded badge ${badge.name} to user ${userId}`);
      }
    }

    return newlyAwarded;
  }

  // Initial seeding for badges - can be called via admin or app bootstrap
  async seedBadges() {
    const badges = [
      {
        code: 'STREAK_7',
        name: '7-Day Warrior',
        description: 'Maintain a learning streak for 7 consecutive days',
        requirement_type: 'STREAK',
        requirement_value: 7,
        icon_url: 'assets/badges/streak-7.svg'
      },
      {
        code: 'STREAK_30',
        name: '30-Day Legend',
        description: 'Maintain a learning streak for 30 consecutive days',
        requirement_type: 'STREAK',
        requirement_value: 30,
        icon_url: 'assets/badges/streak-30.svg'
      },
      {
        code: 'TIME_10_H',
        name: 'Listening Enthusiast',
        description: 'Listen to 10 hours of English content',
        requirement_type: 'TIME',
        requirement_value: 10 * 3600,
        icon_url: 'assets/badges/time-10h.svg'
      },
      {
        code: 'VOCAB_100',
        name: 'Word Collector',
        description: 'Master 100 vocabulary words',
        requirement_type: 'VOCAB',
        requirement_value: 100,
        icon_url: 'assets/badges/vocab-100.svg'
      }
    ];

    for (const badge of badges) {
      await this.prisma.badge.upsert({
        where: { code: badge.code },
        update: badge,
        create: badge,
      });
    }
  }
}
