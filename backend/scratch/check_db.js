const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.userVocabulary.count();
    const users = await prisma.user.findMany({
        take: 5,
        select: { id: true, email: true }
    });
    console.log('Total vocabulary rows:', count);
    console.log('Users in DB:', JSON.stringify(users, null, 2));
    
    const vocab = await prisma.userVocabulary.findMany({
        take: 10
    });
    console.log('Vocab samples:', JSON.stringify(vocab, null, 2));
  } catch (err) {
    console.error('Prisma Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
