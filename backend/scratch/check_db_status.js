const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking database tables...');
  try {
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_catalog.pg_tables 
      WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'
    `;
    console.log('Tables found:', tables);
    
    const vocabCount = await prisma.userVocabulary.count();
    console.log('UserVocabulary count:', vocabCount);
    
    try {
      const historyCount = await prisma.reviewHistory.count();
      console.log('ReviewHistory count:', historyCount);
    } catch (e) {
      console.log('ReviewHistory table MISSING or error:', e.message);
    }
  } catch (error) {
    console.error('Database connection error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
