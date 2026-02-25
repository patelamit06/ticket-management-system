import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');
const schema = process.env.DB_SCHEMA?.trim();
const adapter = new PrismaPg({ connectionString: url }, schema ? { schema } : undefined);
const prisma = new PrismaClient({ adapter });

const countries: { dialCode: string; name: string; isoCode: string | null; sortOrder: number }[] = [

  { dialCode: '+91', name: 'India', isoCode: 'IN', sortOrder: 14 },
  { dialCode: '+46', name: 'Sweden', isoCode: 'SE', sortOrder: 28 },
  { dialCode: '+44', name: 'UK', isoCode: 'GB', sortOrder: 31 },
  { dialCode: '+1', name: 'US/Canada', isoCode: 'US', sortOrder: 32 },
];

async function main() {
  for (const c of countries) {
    await prisma.country.upsert({
      where: { dialCode: c.dialCode },
      create: { dialCode: c.dialCode, name: c.name, isoCode: c.isoCode, sortOrder: c.sortOrder },
      update: { name: c.name, isoCode: c.isoCode, sortOrder: c.sortOrder },
    });
  }
  console.log('Seeded', countries.length, 'countries');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
