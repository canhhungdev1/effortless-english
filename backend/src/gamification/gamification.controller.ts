import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private usersService: UsersService) {}

  @Post('add-xp')
  async addXp(@Request() req: any, @Body('amount') amount: number) {
    const userId = req.user.id;
    return this.usersService.addXp(userId, amount || 10);
  }
}
