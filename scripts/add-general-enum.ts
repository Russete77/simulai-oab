import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Adicionando GENERAL ao enum Subject...\n");

    await prisma.$executeRawUnsafe(`
      ALTER TYPE "Subject" ADD VALUE IF NOT EXISTS 'GENERAL';
    `);

    console.log("✅ GENERAL adicionado com sucesso!\n");
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
