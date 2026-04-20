
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const courseId = req.query.courseId as string;
          const lessonId = req.query.lessonId as string;
          
          let dest = process.env.MEDIA_PATH || './public/media';
          if (courseId) {
            dest = join(dest, courseId);
            if (lessonId) {
              dest = join(dest, lessonId);
            }
          }

          
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          cb(null, dest);
        },
        filename: (req, file, cb) => {

          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadFile(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('File upload failed');
    }
    
    const courseId = req.query.courseId as string;
    const lessonId = req.query.lessonId as string;
    
    let url = `/media/${file.filename}`;
    if (courseId) {
      url = `/media/${courseId}/${file.filename}`;
      if (lessonId) {
        url = `/media/${courseId}/${lessonId}/${file.filename}`;
      }
    }


    return {
      url,
    };
  }
}
