import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async addXp(userId: string, amount: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    let { xp, level, streak, last_study_date } = user;
    
    // Ensure values are numbers (handles old users with null values)
    xp = xp || 0;
    level = level || 1;
    streak = streak || 0;
    
    // Update XP
    xp += amount;

    // Check Level Up
    const xpNeeded = level * 100;
    if (xp >= xpNeeded) {
      xp -= xpNeeded;
      level += 1;
    }

    // Update Streak dynamically based on ReviewHistory
    const history = await this.prisma.reviewHistory.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: { created_at: true }
    });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const dates = [...new Set(history.map(h => h.created_at.toISOString().split('T')[0]))];
    // If we just added XP, we consider the user has studied today
    if (!dates.includes(todayStr)) dates.unshift(todayStr);

    let currentStreak = 0;
    let checkDate = new Date(now);
    let checkDateStr = todayStr;

    const datesSet = new Set(dates);
    while (datesSet.has(checkDateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
      checkDateStr = checkDate.toISOString().split('T')[0];
    }
    streak = currentStreak;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        xp,
        level,
        streak,
        last_study_date: now
      }
    });
  }
}
