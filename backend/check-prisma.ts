import { PrismaClient } from '@prisma/client';

console.log('Keys of PrismaClient prototype:', Object.getOwnPropertyNames(PrismaClient.prototype));
const prisma = new PrismaClient({} as any);
console.log('Prisma instance created');
console.log('Internal engine config:', (prisma as any)._engineConfig);
