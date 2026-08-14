require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  errorFormat: 'pretty',
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Test database connection on startup (async, non-blocking)
prisma.$connect()
  .then(() => console.log('✓ Database connected successfully'))
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
    // Don't exit - allow server to start anyway in case DB is temporarily unavailable
  });

module.exports = prisma;
