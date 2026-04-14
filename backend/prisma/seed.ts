import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding data with slugs and organized media structure...');

  // 1. Create Course: Effortless English
  const effortlessSlug = 'effortless-english';
  const effortless = await prisma.course.upsert({
    where: { slug: effortlessSlug },
    update: {},
    create: {
      slug: effortlessSlug,
      title: 'Effortless English Original Course',
      description: 'Khóa học phản xạ tiếng Anh tự động của AJ Hoge.',
      level: 'Pre-Intermediate',
      cover_image: 'assets/images/course-effortless.webp',
      is_vip: true,
      stage: 1,
    },
  });

  // --- LESSON 1: Day Of The Dead ---
  const dotdSlug = 'day-of-the-dead';
  const dotdMediaBase = `/media/${effortlessSlug}/${dotdSlug}`;

  // Clean up existing lesson to avoid conflict or duplicate content
  await prisma.lesson.deleteMany({ where: { slug: dotdSlug, course_id: effortless.id } });

  const dotd = await prisma.lesson.create({
    data: {
      course_id: effortless.id,
      slug: dotdSlug,
      order: 1,
      title: 'Day Of The Dead',
      progress: 0,
    },
  });

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
        audio_url: `${dotdMediaBase}/vocabulary.mp3`,
        vtt_url: `${dotdMediaBase}/vocabulary.vtt`,
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
        audio_url: `${dotdMediaBase}/mini-story-a.mp3`,
        vtt_url: `${dotdMediaBase}/mini-story-a.vtt`,
        data: { lines: [] }
      }
    ]
  });
  
  // --- LESSON 2: A Kiss ---
  const aKissSlug = 'a-kiss';
  const aKissMediaBase = `/media/${effortlessSlug}/${aKissSlug}`;

  await prisma.lesson.deleteMany({ where: { slug: aKissSlug, course_id: effortless.id } });
  
  const aKiss = await prisma.lesson.create({
    data: {
      course_id: effortless.id,
      slug: aKissSlug,
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
        audio_url: `${aKissMediaBase}/article.mp3`,
        vtt_url: `${aKissMediaBase}/article.vtt`,
        content_en: 'Carlos buys a new car. It is a very expensive car...',
        content_vi: 'Carlos mua một chiếc xe hơi mới. Đó là một chiếc xe rất đắt tiền...',
      },
      {
        lesson_id: aKiss.id,
        type: 'VOCABULARY',
        title: 'Vocabulary Explanation',
        audio_url: `${aKissMediaBase}/vocabulary.mp3`,
        vtt_url: `${aKissMediaBase}/vocabulary.vtt`,
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
        audio_url: `${aKissMediaBase}/mini-story-a.mp3`,
        vtt_url: `${aKissMediaBase}/mini-story-a.vtt`,
        data: { lines: [] }
      },
      {
        lesson_id: aKiss.id,
        type: 'MINI_STORY',
        title: 'Mini-Story B',
        audio_url: `${aKissMediaBase}/mini-story-b.mp3`,
        vtt_url: `${aKissMediaBase}/mini-story-b.vtt`,
        data: { lines: [] }
      }
    ]
  });

  console.log('Seeding complete with slug-based media structure.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
