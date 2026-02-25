import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('DATABASE_URL');
    const schema = config.get<string>('DB_SCHEMA')?.trim();
    const adapter = new PrismaPg(
      { connectionString: url },
      schema ? { schema } : undefined,
    );
    super({ adapter });
  }

  async onModuleInit() {
    // Adapter applies DB_SCHEMA (search_path) per connection
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
