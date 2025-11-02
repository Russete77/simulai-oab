import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLogs() {
  const logs = await prisma.webhookLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      event: true,
      error: true,
      createdAt: true,
      processed: true,
    },
  });

  console.log('\n📋 Recent Webhook Logs:\n');
  logs.forEach((log) => {
    console.log(`Event: ${log.event}`);
    console.log(`Processed: ${log.processed}`);
    console.log(`Time: ${log.createdAt}`);
    if (log.error) {
      console.log(`❌ Error: ${log.error}`);
    } else {
      console.log(`✅ Success`);
    }
    console.log('---');
  });

  await prisma.$disconnect();
}

checkLogs().catch(console.error);
