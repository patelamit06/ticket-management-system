import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');
const schema = process.env.DB_SCHEMA?.trim();
const adapter = new PrismaPg({ connectionString: url }, schema ? { schema } : undefined);
const prisma = new PrismaClient({ adapter });

const countries: { dialCode: string; name: string; isoCode: string | null; sortOrder: number }[] = [
  { dialCode: '+46', name: 'Sweden', isoCode: 'SE', sortOrder: 28 },
  { dialCode: '+44', name: 'UK', isoCode: 'GB', sortOrder: 31 },
  { dialCode: '+1', name: 'US/Canada', isoCode: 'US', sortOrder: 32 },
];

async function main() {
  for (const c of countries) {
    await prisma.country.upsert({
      where: { dialCode: c.dialCode },
      create: { dialCode: c.dialCode, name: c.name, isoCode: c.isoCode, sortOrder: c.sortOrder, isActive: true },
      update: { name: c.name, isoCode: c.isoCode, sortOrder: c.sortOrder, isActive: true },
    });
  }
  // Deactivate any country no longer in the seed list (e.g. India) so it drops out of
  // both the phone-code and browse dropdowns without deleting historical rows.
  const keep = countries.map((c) => c.dialCode);
  const { count } = await prisma.country.updateMany({
    where: { dialCode: { notIn: keep }, isActive: true },
    data: { isActive: false },
  });
  console.log('Seeded', countries.length, 'countries; deactivated', count);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
