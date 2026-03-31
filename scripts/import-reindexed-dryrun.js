const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function loadReindexed() {
  const p = path.resolve(__dirname, '..', 'dataset_reindexed.json');
  if (!fs.existsSync(p)) throw new Error('dataset_reindexed.json not found');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function main() {
  try {
    const data = await loadReindexed();
    console.log('Loaded', data.length, 'rows from dataset_reindexed.json');

    const report = {
      totalRows: data.length,
      alreadyInDB: 0,
      wouldInsert: 0,
      conflictsSample: [],
      errors: []
    };

    // Fetch existing (examId, questionNumber) keys in bulk
    console.log('Fetching existing question keys from DB...');
    const existingRows = await prisma.$queryRaw`SELECT "examId", "questionNumber" FROM "Question"`;
    const existingSet = new Set(existingRows.map(r => `${r.examId}::${r.questionNumber}`));
    console.log('Existing keys in DB:', existingSet.size);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const examId = row.exam_id || row.examId || row.examId || '';
      const qnum = row.question_number;
      if (!examId || typeof qnum !== 'number') {
        report.errors.push({ index: i, reason: 'missing examId or question_number', row: { examId, question_number: qnum } });
        continue;
      }
      const key = `${examId}::${qnum}`;
      if (existingSet.has(key)) {
        report.alreadyInDB++;
        if (report.conflictsSample.length < 20) report.conflictsSample.push({ index: i, examId, question_number: qnum });
      } else {
        report.wouldInsert++;
      }
      if ((i+1) % 500 === 0) console.log(`Processed ${i+1}/${data.length}`);
    }

    fs.writeFileSync(path.resolve(__dirname, '..', 'import_reindexed_dryrun_report.json'), JSON.stringify(report, null, 2));
    console.log('Wrote import_reindexed_dryrun_report.json');
    console.log('Summary:', report);

  } catch (e) {
    console.error('Fatal error', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
