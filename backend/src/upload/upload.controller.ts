
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('upload')
export class UploadController {
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
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
