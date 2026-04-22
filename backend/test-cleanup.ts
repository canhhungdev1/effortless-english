import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

// Custom initialization for Prisma as per project requirement
let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.split('@').length > 2) {
  const lastAtIndex = connectionString.lastIndexOf('@');
  const credentials = connectionString.substring(0, lastAtIndex);
  const hostPart = connectionString.substring(lastAtIndex + 1);
  const firstColonIndex = credentials.indexOf(':', 11);
  if (firstColonIndex !== -1) {
    const prefix = credentials.substring(0, firstColonIndex);
    const password = credentials.substring(firstColonIndex + 1);
    connectionString = `${prefix}:${password.replace(/@/g, '%40')}@${hostPart}`;
  }
}

const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const mediaPath = join(__dirname, '..', 'frontend', 'public', 'media');

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
  console.log('--- Media Cleanup Simulation ---');
  console.log('Target Path:', mediaPath);
  
  if (!fs.existsSync(mediaPath)) {
    console.error('Error: Media path does not exist!');
    return;
  }

  const allFiles = getAllFiles(mediaPath);
  console.log(`Found ${allFiles.length} files on disk`);

  const usedFiles = new Set<string>();

  // 1. Scan Course cover images
  const courses = await prisma.course.findMany({ select: { cover_image: true } });
  courses.forEach(c => addPathToSet(c.cover_image, usedFiles));

  // 2. Scan Lesson content (audio, vtt, data json)
  const contents = await prisma.lessonContent.findMany({
    select: { audio_url: true, vtt_url: true, data: true }
  });

  contents.forEach(c => {
    if (c.audio_url) {
       console.log('Sample Audio URL:', c.audio_url);
       addPathToSet(c.audio_url, usedFiles);
    }
    addPathToSet(c.vtt_url, usedFiles);
    
    if (c.data) {
      const jsonStr = JSON.stringify(c.data);
      const matches = jsonStr.match(/\/media\/[^\s"']+/g);
      if (matches) {
        matches.forEach(m => addPathToSet(m, usedFiles));
      }
    }
  });

  console.log(`Found ${usedFiles.size} unique used files in Database`);
  const usedArray = Array.from(usedFiles);
  console.log('Used files sample (first 5):', usedArray.slice(0, 5));

  const unusedFiles = allFiles.filter(file => {
    const isUsed = usedFiles.has(file.relativePath);
    if (!isUsed && usedArray.some(u => u.toLowerCase() === file.relativePath.toLowerCase())) {
        console.log(`Case mismatch or similar: ${file.relativePath} vs ${usedArray.find(u => u.toLowerCase() === file.relativePath.toLowerCase())}`);
    }
    return !isUsed;
  });
  
  if (unusedFiles.length === 0) {
    console.log('✅ No unused files found. Your media directory is clean!');
  } else {
    console.log(`⚠️ Found ${unusedFiles.length} unused files.`);
    console.log('Unused files (first 10):');
    unusedFiles.slice(0, 10).forEach(f => console.log(` - ${f.relativePath} (${(f.size / 1024 / 1024).toFixed(2)} MB)`));
    
    const totalSize = unusedFiles.reduce((acc, f) => acc + f.size, 0);
    console.log(`Total potential savings: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n--- DELETING UNUSED FILES ---');
    unusedFiles.forEach(file => {
      try {
        fs.unlinkSync(file.fullPath);
        console.log(`✅ Deleted: ${file.relativePath}`);
      } catch (err) {
        console.error(`❌ Failed to delete ${file.relativePath}:`, err);
      }
    });
    
    console.log(`\n🎉 Cleanup complete! Freed ${(totalSize / 1024 / 1024).toFixed(2)} MB.`);
  }
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });


