import { Controller, Get, Param, Res, NotFoundException, Req } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import * as fs from 'fs';

@Controller('media')
export class MediaController {
  @Get('*path')
  serveMedia(@Param('path') path: string | string[], @Res() res: Response) {
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
