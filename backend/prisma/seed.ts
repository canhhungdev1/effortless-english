import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  let connectionString = process.env.DATABASE_URL;
    
  // Auto-escape '@' in password if present
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
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Seeding badges...');

  const badges = [
    {
      code: 'STREAK_7',
      name: '7-Day Warrior',
      description: 'Maintain a learning streak for 7 consecutive days',
      requirement_type: 'STREAK',
      requirement_value: 7,
      icon_url: 'assets/badges/streak-7.svg'
    },
    {
      code: 'STREAK_30',
      name: '30-Day Legend',
      description: 'Maintain a learning streak for 30 consecutive days',
      requirement_type: 'STREAK',
      requirement_value: 30,
      icon_url: 'assets/badges/streak-30.svg'
    },
    {
      code: 'TIME_10_H',
      name: 'Listening Enthusiast',
      description: 'Listen to 10 hours of English content',
      requirement_type: 'TIME',
      requirement_value: 10 * 3600,
      icon_url: 'assets/badges/time-10h.svg'
    },
    {
      code: 'VOCAB_100',
      name: 'Word Collector',
      description: 'Master 100 vocabulary words',
      requirement_type: 'VOCAB',
      requirement_value: 100,
      icon_url: 'assets/badges/vocab-100.svg'
    }
  ];

  try {
    for (const badge of badges) {
      await prisma.badge.upsert({
        where: { code: badge.code },
        update: badge,
        create: badge,
      });
      console.log(`- Upserted badge: ${badge.name}`);
    }
    console.log('Seeding complete.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
