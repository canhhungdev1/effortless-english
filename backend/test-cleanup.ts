import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const mediaPath = join(__dirname, 'public', 'media');

function getAllFiles(dirPath: string, arrayOfFiles: any[] = [], baseDir: string = ''): any[] {
  if (!fs.existsSync(dirPath)) return [];
  
  const files = fs.readdirSync(dirPath);
  baseDir = baseDir || dirPath;

  files.forEach((file) => {
    const fullPath = join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles, baseDir);
    } else {
      const relativePath = fullPath.replace(baseDir, '').replace(/\\/g, '/').replace(/^\//, '');
      const size = fs.statSync(fullPath).size;
      arrayOfFiles.push({ relativePath, size, fullPath });
    }
  });

  return arrayOfFiles;
}

function addPathToSet(url: string | null, set: Set<string>) {
  if (!url) return;
  const mediaToken = '/media/';
  const index = url.indexOf(mediaToken);
  if (index !== -1) {
    let relativePath = url.substring(index + mediaToken.length);
    relativePath = relativePath.split('?')[0];
    set.add(relativePath);
  }
}

async function run() {
  console.log('Media Path:', mediaPath);
  const allFiles = getAllFiles(mediaPath);
  console.log(`Found ${allFiles.length} files on disk`);

  const usedFiles = new Set<string>();

  const courses = await prisma.course.findMany({ select: { cover_image: true } });
  courses.forEach(c => addPathToSet(c.cover_image, usedFiles));

  const contents = await prisma.lessonContent.findMany({
    select: { audio_url: true, vtt_url: true, data: true }
  });

  contents.forEach(c => {
    addPathToSet(c.audio_url, usedFiles);
    addPathToSet(c.vtt_url, usedFiles);
    
    if (c.data) {
      const jsonStr = JSON.stringify(c.data);
      const matches = jsonStr.match(/\/media\/[^\s"']+/g);
      if (matches) {
        matches.forEach(m => addPathToSet(m, usedFiles));
      }
    }
  });

  console.log(`Found ${usedFiles.size} unique used files in DB`);
  console.log('Used files sample:', Array.from(usedFiles).slice(0, 5));

  const unusedFiles = allFiles.filter(file => !usedFiles.has(file.relativePath));
  console.log(`Found ${unusedFiles.length} unused files`);
  console.log('Unused files sample:', unusedFiles.slice(0, 5).map(f => f.relativePath));
}

run().catch(console.error).finally(() => prisma.$disconnect());
