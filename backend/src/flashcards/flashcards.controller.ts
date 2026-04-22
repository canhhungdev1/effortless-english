import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('flashcards')
@UseGuards(JwtAuthGuard)
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Get('due')
  getDue(@CurrentUser() user: any) {
    return this.flashcardsService.getDueWords(user.id);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.flashcardsService.getReviewStats(user.id);
  }

  @Get('study-stats')
  getStudyStats(@CurrentUser() user: any) {
    return this.flashcardsService.getStudyStats(user.id);
  }

  @Get('all')
  getAll(@CurrentUser() user: any) {
    return this.flashcardsService.getAllWords(user.id);
  }

  @Post('add')
  add(@CurrentUser() user: any, @Body() data: any) {
    console.log(`[Flashcards] Adding word for user ${user.id}:`, data.word);
    return this.flashcardsService.addToFlashcards(user.id, data);
  }

  @Post('sync')
  sync(@CurrentUser() user: any, @Body() data: any[]) {
    console.log(`[Flashcards] Syncing ${data?.length} words for user ${user.id}`);
    return this.flashcardsService.syncFlashcards(user.id, data || []);
  }

  @Post('toggle-favorite')
  toggleFavorite(@CurrentUser() user: any, @Body() data: any) {
    return this.flashcardsService.toggleFavorite(user.id, data);
  }

  @Patch('review/:id')
  review(@Param('id') id: string, @Body('rating') rating: number) {
    return this.flashcardsService.processReview(id, rating);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.flashcardsService.updateWord(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.flashcardsService.deleteWord(id);
  }
}
