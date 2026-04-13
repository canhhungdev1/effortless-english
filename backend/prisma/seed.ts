import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding data...');

  // 1. Create Courses
  const effortless = await prisma.course.upsert({
    where: { id: 'effortless' },
    update: {},
    create: {
      id: 'effortless',
      title: 'Effortless English Original Course',
      description: 'Khóa học phản xạ tiếng Anh tự động của AJ Hoge.',
      level: 'Pre-Intermediate',
      cover_image: 'assets/images/course-effortless.webp',
      is_vip: true,
      stage: 1,
    },
  });

  // 2. Create Lesson: Day Of The Dead
  // Delete existing to start fresh
  await prisma.lesson.deleteMany({ where: { id: 'day-of-the-dead' } });

  const dotd = await prisma.lesson.create({
    data: {
      id: 'day-of-the-dead',
      course_id: 'effortless',
      order: 1,
      title: 'Day Of The Dead',
      progress: 0,
    },
  });

  // 3. Add Content for Day Of The Dead
  await prisma.lessonContent.createMany({
    data: [
      {
        lesson_id: dotd.id,
        type: 'ARTICLE',
        content_en: `I arrive in Guatemala on <strong>The Day of the Dead</strong>, November 1st. I'm <strong>curious</strong> about this holiday, so I go to the <strong>cemetery</strong> to see what's happening. What I find is quite interesting.
<br><br>
The <strong>atmosphere</strong> is like a party. There are people everywhere. Families are sitting around the <strong>graves</strong> of their dead <strong>ancestors</strong>. They clean the graves and add <strong>fresh flowers</strong>.`,
        content_vi: `Tôi đến Guatemala vào <strong>Ngày của mạc giới</strong>, mùng 1 tháng 11. Tôi <strong>tò mò</strong> về ngày lễ này, vì vậy tôi đến <strong>nghĩa trang</strong> để xem điều gì đang diễn ra.`,
      },
      {
        lesson_id: dotd.id,
        type: 'VOCABULARY',
        audio_url: '/media/day-of-the-dead.mp3',
        vtt_url: '/media/vocabulary.vtt',
        data: {
          paragraphs: [
            'In this part, we talk about "Somber". Somber means serious or sad.',
            'Next is "Cemetery". A cemetery is a place where dead people are buried.'
          ],
          keywords: [
            { word: 'Somber', phonetic: '/ sɑm.bɚ/', translation: 'U ám, buồn rầu', example: 'The atmosphere was somber and serious.' },
            { word: 'Cemetery', phonetic: '/ sem.ə.tri/', translation: 'Nghĩa trang', example: 'They go to the cemetery to visit the graves of their ancestors.' }
          ]
        }
      },
      {
        lesson_id: dotd.id,
        type: 'MINI_STORY',
        title: 'Mini-Story A',
        audio_url: '/media/day-of-the-dead.mp3',
        vtt_url: '/media/day-of-the-dead.vtt',
        data: { lines: [] }
      }
    ]
  });
  
  // 4. Create Lesson: A Kiss
  await prisma.lesson.deleteMany({ where: { id: 'a-kiss' } });
  const aKiss = await prisma.lesson.create({
    data: {
      id: 'a-kiss',
      course_id: 'effortless',
      order: 2,
      title: 'A Kiss',
      progress: 0,
    },
  });

  await prisma.lessonContent.createMany({
    data: [
      {
        lesson_id: aKiss.id,
        type: 'ARTICLE',
        title: 'Main Story',
        audio_url: '/media/orignal-course/a-kiss/1 A Kiss Audio.mp3',
        vtt_url: '/media/orignal-course/a-kiss/1 A Kiss Audio.vtt',
        content_en: 'Carlos buys a new car. It is a very expensive car...',
        content_vi: 'Carlos mua một chiếc xe hơi mới. Đó là một chiếc xe rất đắt tiền...',
      },
      {
        lesson_id: aKiss.id,
        type: 'VOCABULARY',
        title: 'Vocabulary Explanation',
        audio_url: '/media/orignal-course/a-kiss/2 A Kiss Vocab.mp3',
        vtt_url: '/media/orignal-course/a-kiss/2 A Kiss Vocab.vtt',
        data: {
          paragraphs: ['In this lesson we are going to learn about "Huge". Huge means very very big.'],
          keywords: [
            { word: 'Huge', phonetic: '/hjuːdʒ/', translation: 'Khổng lồ', example: 'It was a huge, blue, fast car.' }
          ]
        }
      },
      {
        lesson_id: aKiss.id,
        type: 'MINI_STORY',
        title: 'Mini-Story A',
        audio_url: '/media/orignal-course/a-kiss/3 A Kiss MS-A.mp3',
        vtt_url: '/media/orignal-course/a-kiss/3 A Kiss MS-A.vtt',
        data: { lines: [] }
      },
      {
        lesson_id: aKiss.id,
        type: 'MINI_STORY',
        title: 'Mini-Story B',
        audio_url: '/media/orignal-course/a-kiss/4 A Kiss MS-B.mp3',
        vtt_url: '/media/orignal-course/a-kiss/4 A Kiss MS-B.vtt',
        data: { lines: [] }
      }
    ]
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
