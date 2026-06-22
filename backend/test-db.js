require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$connect();
  console.log('✅ Database connected successfully!\n');

  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename
  `;

  console.log('📋 Tables in your Neon database:');
  tables.forEach(t => console.log('  ✔', t.tablename));

  await prisma.$disconnect();
  console.log('\n🎉 Day 3 Complete! All tables are live in Neon.');
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  prisma.$disconnect();
});
