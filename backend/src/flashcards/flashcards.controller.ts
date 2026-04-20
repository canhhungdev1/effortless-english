import { Controller, Get, Post, Body, Param, Patch, Delete, Headers } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';

@Controller('flashcards')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  private readonly DUMMY_USER_ID = 'user-1';

  @Get('due')
  getDue() {
    return this.flashcardsService.getDueWords(this.DUMMY_USER_ID);
  }

  @Get('all')
  getAll() {
    return this.flashcardsService.getAllWords(this.DUMMY_USER_ID);
  }

  @Post('add')
  add(@Body() data: any) {
    return this.flashcardsService.addToFlashcards(this.DUMMY_USER_ID, data);
  }

  @Post('toggle-favorite')
  toggleFavorite(@Body() data: any) {
    return this.flashcardsService.toggleFavorite(this.DUMMY_USER_ID, data);
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
