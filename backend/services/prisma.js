const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// Prevent multiple Prisma instances in development (hot reload)
const globalForPrisma = global;

if (!globalForPrisma.prisma) {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma;

module.exports = prisma;
