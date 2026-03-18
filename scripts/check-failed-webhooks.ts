import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFailedLogs() {
  console.log('\n🔍 Checking for subscription events...\n');

  const subscriptionEvents = await prisma.webhookLog.findMany({
    where: {
      eventType: { contains: 'subscription' },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  if (subscriptionEvents.length === 0) {
    console.log('❌ No subscription events found in WebhookLog table');
    console.log('\nThis means the subscription event is failing');
    console.log('before it can be logged to the database.\n');
  } else {
    subscriptionEvents.forEach((log) => {
      console.log(`Event: ${log.eventType}`);
      console.log(`Processed: ${log.processed}`);
      console.log(`Time: ${log.createdAt}`);
      if (log.error) {
        console.log(`❌ Error: ${log.error}`);
      }
      console.log('---');
    });
  }

  console.log('\n🔍 Checking for ANY failed events...\n');

  const failedEvents = await prisma.webhookLog.findMany({
    where: {
      processed: false,
      error: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  if (failedEvents.length === 0) {
    console.log('✅ No failed events with errors in database');
  } else {
    failedEvents.forEach((log) => {
      console.log(`Event: ${log.eventType}`);
      console.log(`Error: ${log.error}`);
      console.log(`Time: ${log.createdAt}`);
      console.log('---');
    });
  }

  await prisma.$disconnect();
}

checkFailedLogs().catch(console.error);
