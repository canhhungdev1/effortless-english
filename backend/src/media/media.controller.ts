import { Controller, Get, Post, Param, Res, NotFoundException, Req, Body } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import * as fs from 'fs';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('maintenance/status')
  getStatus() {
    return this.mediaService.getStorageStats();
  }

  @Post('maintenance/cleanup')
  cleanup() {
    return this.mediaService.cleanup();
  }

  @Post('save-vtt-external')
  saveVttExternal(@Body() body: { content: string; targetPath: string; fileName: string }) {
    return this.mediaService.saveVttExternal(body.content, body.targetPath, body.fileName);
  }

  @Get('*path')
  serveMedia(@Param('path') path: string, @Res() res: Response) {
    const filePathRelative = Array.isArray(path) ? path.join('/') : path;



    
    if (!filePathRelative) {
      console.error('[MediaController] No file path provided in request');
      throw new NotFoundException('Media file not found');
    }

    const mediaPath = process.env.MEDIA_PATH || join(__dirname, '..', '..', 'public', 'media');
    const filePath = join(mediaPath, filePathRelative);


    console.log(`[MediaController] Serving file: ${filePath}`);

    if (!fs.existsSync(filePath)) {

      console.error(`[MediaController] File NOT found: ${filePath}`);
      throw new NotFoundException('Media file not found');
    }

    return res.sendFile(filePath);
  }
}
