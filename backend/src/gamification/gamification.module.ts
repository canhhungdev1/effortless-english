import { Module } from '@nestjs/common';
import { GamificationController } from './gamification.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [GamificationController],
})
export class GamificationModule {}
