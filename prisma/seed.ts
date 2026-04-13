import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import { DEFAULT_BOTANICALS, SEED_BATCHES } from '../src/lib/botanicals.js';

function getPrismaClient() {
  if (process.env.TURSO_DATABASE_URL) {
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

const prisma = getPrismaClient();

async function main() {
  // Check if already seeded
  const existingBotanicals = await prisma.botanical.count();
  if (existingBotanicals > 0) {
    console.log('Database already seeded, skipping.');
    return;
  }

  console.log('Seeding botanicals...');
  for (const bot of DEFAULT_BOTANICALS) {
    await prisma.botanical.create({ data: bot });
  }

  const allBotanicals = await prisma.botanical.findMany();
  const botanicalMap = new Map(allBotanicals.map((b) => [b.name, b.id]));

  console.log('Seeding historical batches...');
  for (const batch of SEED_BATCHES) {
    const items = Object.entries(batch.items);
    const juniperAmount = batch.items['Juniper + Lemon'] || 0;
    const totalVolume = items.reduce((sum, [, amount]) => sum + amount, 0);

    // Create a recipe from this batch's ratios
    const recipe = await prisma.recipe.create({
      data: {
        name: batch.name,
        createdAt: new Date(batch.date),
        updatedAt: new Date(batch.date),
        items: {
          create: items.map(([name, amount]) => ({
            botanicalId: botanicalMap.get(name)!,
            ratio: juniperAmount > 0 ? amount / juniperAmount : 0,
          })),
        },
      },
    });

    // Create the batch log entry
    await prisma.batch.create({
      data: {
        name: batch.name,
        date: new Date(batch.date),
        totalVolume,
        notes: batch.notes,
        recipeId: recipe.id,
        items: {
          create: items.map(([name, amount]) => ({
            botanicalId: botanicalMap.get(name)!,
            amount,
          })),
        },
      },
    });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
