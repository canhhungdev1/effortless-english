import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    let connectionString = process.env.DATABASE_URL;
    
    // Auto-escape '@' in password if present in the raw string
    if (connectionString && connectionString.split('@').length > 2) {
      // Find the last '@' which separates credentials from host
      const lastAtIndex = connectionString.lastIndexOf('@');
      const credentials = connectionString.substring(0, lastAtIndex);
      const hostPart = connectionString.substring(lastAtIndex + 1);
      
      const firstColonIndex = credentials.indexOf(':', 11); // skip postgresql://
      if (firstColonIndex !== -1) {
        const prefix = credentials.substring(0, firstColonIndex);
        const password = credentials.substring(firstColonIndex + 1);
        connectionString = `${prefix}:${password.replace(/@/g, '%40')}@${hostPart}`;
      }
    }

    const pool = new Pool({ 
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      connectionTimeoutMillis: 20000,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
// Force refresh for new models: UserVocabulary
