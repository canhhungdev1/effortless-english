const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Content Check ---');
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });
    console.log('Users found:', users);

    for (const user of users) {
      const vocabCount = await prisma.userVocabulary.count({
        where: { user_id: user.id }
      });
      const historyCount = await prisma.reviewHistory.count({
        where: { user_id: user.id }
      });
      console.log(`User: ${user.name} (${user.email}) - Vocab: ${vocabCount}, History: ${historyCount}`);
    }

    const totalVocab = await prisma.userVocabulary.count();
    console.log('Total UserVocabulary in DB:', totalVocab);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
