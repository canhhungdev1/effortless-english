import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private gamificationService: GamificationService) {}

  @Post('track-activity')
  async trackActivity(
    @Request() req: any,
    @Body() data: { xp?: number; seconds?: number; words?: number },
  ) {
    const userId = req.user.id;
    return this.gamificationService.trackActivity(userId, data);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    const userId = req.user.id;
    return this.gamificationService.getStats(userId);
  }

  @Get('badges')
  async getBadges(@Request() req: any) {
    const userId = req.user.id;
    return this.gamificationService.getBadges(userId);
  }

  @Post('seed-badges')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async seedBadges() {
    await this.gamificationService.seedBadges();
    return { message: 'Badges seeded successfully' };
  }

  @Post('sync-guest')
  async syncGuest(
    @Request() req: any,
    @Body() data: { xp: number; seconds: number; words: number }
  ) {
    const userId = req.user.id;
    return this.gamificationService.trackActivity(userId, data);
  }
}
