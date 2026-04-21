import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly mediaPath = process.env.MEDIA_PATH || join(__dirname, '..', '..', 'public', 'media');

  constructor(private prisma: PrismaService) {}

  async getStorageStats() {
    const allFiles = this.getAllFiles(this.mediaPath);
    const usedFiles = await this.getUsedFilesFromDb();
    
    const unusedFiles = allFiles.filter(file => !usedFiles.has(file.relativePath));
    
    const totalSize = allFiles.reduce((acc, file) => acc + file.size, 0);
    const unusedSize = unusedFiles.reduce((acc, file) => acc + file.size, 0);

    return {
      totalFiles: allFiles.length,
      totalSize: this.formatSize(totalSize),
      unusedFilesCount: unusedFiles.length,
      unusedSize: this.formatSize(unusedSize),
      unusedFiles: unusedFiles.map(f => f.relativePath)
    };
  }

  async cleanup() {
    const stats = await this.getStorageStats();
    let deletedCount = 0;

    for (const relativePath of stats.unusedFiles) {
      const fullPath = join(this.mediaPath, relativePath);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          deletedCount++;
        }
      } catch (err) {
        this.logger.error(`Failed to delete file ${fullPath}: ${err.message}`);
      }
    }

    // Optional: Clean up empty directories
    this.removeEmptyDirs(this.mediaPath);

    return {
      deletedCount,
      message: `Successfully deleted ${deletedCount} unused files.`
    };
  }

  private getAllFiles(dirPath: string, arrayOfFiles: any[] = [], baseDir: string = ''): any[] {
    if (!fs.existsSync(dirPath)) return [];
    
    const files = fs.readdirSync(dirPath);
    baseDir = baseDir || dirPath;

    files.forEach((file) => {
      const fullPath = join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfFiles = this.getAllFiles(fullPath, arrayOfFiles, baseDir);
      } else {
        // Robust relative path extraction (handles Windows vs Unix slashes and case insensitivity)
        const normalizedBaseDir = baseDir.replace(/\\/g, '/');
        const normalizedFullPath = fullPath.replace(/\\/g, '/');
        
        let relativePath = normalizedFullPath;
        if (normalizedFullPath.toLowerCase().startsWith(normalizedBaseDir.toLowerCase())) {
          relativePath = normalizedFullPath.substring(normalizedBaseDir.length);
        }
        relativePath = relativePath.replace(/^\//, '');

        const size = fs.statSync(fullPath).size;
        arrayOfFiles.push({ relativePath, size });
      }
    });

    return arrayOfFiles;
  }

  private async getUsedFilesFromDb(): Promise<Set<string>> {
    const usedFiles = new Set<string>();

    // 1. Get Course cover images
    const courses = await this.prisma.course.findMany({ select: { cover_image: true } });
    courses.forEach(c => this.addPathToSet(c.cover_image, usedFiles));

    // 2. Get Lesson media (audio, vtt)
    const contents = await this.prisma.lessonContent.findMany({
      select: { audio_url: true, vtt_url: true, data: true }
    });

    contents.forEach(c => {
      this.addPathToSet(c.audio_url, usedFiles);
      this.addPathToSet(c.vtt_url, usedFiles);
      
      // 3. Scan JSON data for media URLs (e.g., images in articles)
      if (c.data) {
        const jsonStr = JSON.stringify(c.data);
        const matches = jsonStr.match(/\/media\/[^\s"']+/g);
        if (matches) {
          matches.forEach(m => this.addPathToSet(m, usedFiles));
        }
      }
    });

    return usedFiles;
  }

  private addPathToSet(url: string | null, set: Set<string>) {
    if (!url) return;
    // URL format: /media/abc/xyz/file.mp3 or http://.../media/...
    // We want the part after /media/
    const mediaToken = '/media/';
    const index = url.indexOf(mediaToken);
    if (index !== -1) {
      let relativePath = url.substring(index + mediaToken.length);
      // Remove query params if any
      relativePath = relativePath.split('?')[0];
      try {
        relativePath = decodeURIComponent(relativePath);
      } catch (e) {
        // ignore malformed URI
      }
      set.add(relativePath);
    }
  }

  private removeEmptyDirs(dirPath: string) {
    if (!fs.existsSync(dirPath)) return;
    const files = fs.readdirSync(dirPath);
    if (files.length > 0) {
      files.forEach(file => {
        const fullPath = join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          this.removeEmptyDirs(fullPath);
        }
      });
    }

    // Check again after subdirs might have been deleted
    const updatedFiles = fs.readdirSync(dirPath);
    if (updatedFiles.length === 0 && dirPath !== this.mediaPath) {
      fs.rmdirSync(dirPath);
    }
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async saveVttExternal(content: string, targetPath: string, fileName: string) {
    try {
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      const fullPath = join(targetPath, fileName);
      fs.writeFileSync(fullPath, content, 'utf8');
      this.logger.log(`External VTT saved: ${fullPath}`);
      return { success: true, path: fullPath };
    } catch (err) {
      this.logger.error(`Failed to save external VTT: ${err.message}`);
      throw err;
    }
  }
}
