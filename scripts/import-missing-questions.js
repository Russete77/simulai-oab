const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');

(async function main() {
  const dataPath = path.resolve(__dirname, '..', 'dataset_complete.json');
  if (!fs.existsSync(dataPath)) {
    console.error('dataset_complete.json not found at', dataPath);
    process.exit(2);
  }

  console.log(`Reading dataset from ${dataPath}`);
  const raw = fs.readFileSync(dataPath, 'utf8');
  const all = JSON.parse(raw);
  console.log('Total rows in dataset:', all.length);

  // Build map of unique keys -> first occurrence
  const firstMap = new Map();
  for (let i = 0; i < all.length; i++) {
    const row = all[i];
    const key = `${row.exam_id}::${row.question_number}`;
    if (!firstMap.has(key)) firstMap.set(key, row);
  }

  console.log('Unique examId+questionNumber in dataset:', firstMap.size);

  // Load existing questions from DB (only keys)
  console.log('Loading existing questions from database (keys only)...');
  const existing = await prisma.question.findMany({ select: { examId: true, questionNumber: true } });
  const existingSet = new Set(existing.map(r => `${r.examId}::${r.questionNumber}`));
  console.log('Existing questions in DB:', existingSet.size);

  // Determine missing
  const missingKeys = [];
  for (const [key, row] of firstMap.entries()) {
    if (!existingSet.has(key)) missingKeys.push({ key, row });
  }

  console.log('Missing unique questions to import:', missingKeys.length);

  if (missingKeys.length === 0) {
    console.log('Nothing to do. Database already contains all unique questions from dataset.');
    await prisma.$disconnect();
    process.exit(0);
  }

  console.log('\nSample of first 30 missing keys:');
  missingKeys.slice(0, 30).forEach((m, i) => console.log(`  ${i + 1}. ${m.key}`));

  // Save sample report
  const report = {
    totalDatasetRows: all.length,
    uniqueKeysInDataset: firstMap.size,
    existingInDB: existingSet.size,
    missingCount: missingKeys.length,
    missingSample: missingKeys.slice(0, 200).map(m => m.key),
  };
  fs.writeFileSync(path.resolve(__dirname, '..', 'analysis_missing_questions_report.json'), JSON.stringify(report, null, 2));
  console.log('\nWrote analysis_missing_questions_report.json (summary + sample).');

  if (!APPLY) {
    console.log('\nDry-run mode (no writes). To apply changes run this script with `--apply`.');
    await prisma.$disconnect();
    process.exit(0);
  }

  console.log('\n--apply flag detected: proceeding to insert missing questions.');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < missingKeys.length; i++) {
    const { row } = missingKeys[i];
    // Prepare data
    const subjectMap = require('../types/dataset').SUBJECT_MAP;
    const subject = subjectMap[row.question_type];
    if (!subject) {
      console.warn(`Unknown subject for ${row.id} / ${row.question_type} - skipping`);
      skipped++;
      continue;
    }

    const [yearStr, phaseStr] = row.exam_id.split('-');
    const examYear = parseInt(yearStr);
    const examPhase = parseInt(phaseStr);

    try {
      await prisma.question.create({
        data: {
          examId: row.exam_id,
          examYear,
          examPhase,
          questionNumber: row.question_number,
          subject: subject,
          statement: row.question,
          nullified: !!row.nullified,
          keywords: [],
          legalReferences: undefined,
          alternatives: {
            create: (row.choices && row.choices.label)
              ? row.choices.label.map((label, index) => ({
                  label,
                  text: row.choices.text[index],
                  isCorrect: index === row.answerKey,
                }))
              : [],
          },
        },
      });
      imported++;
    } catch (e) {
      // If unique constraint violation occurs concurrently, skip
      if (e.code === 'P2002') {
        skipped++;
      } else {
        console.error(`Error inserting ${row.id} (${row.exam_id}::${row.question_number}):`, e.message || e);
        errors++;
      }
    }

    if ((i + 1) % 100 === 0) {
      console.log(`Processed ${i + 1}/${missingKeys.length} | imported: ${imported} | skipped: ${skipped} | errors: ${errors}`);
    }
  }

  console.log('\nImport finished. Summary:');
  console.log(`  Imported: ${imported}`);
  console.log(`  Skipped (already exists or unknown subject): ${skipped}`);
  console.log(`  Errors: ${errors}`);

  const totalNow = await prisma.question.count();
  console.log(`\nTotal questions in DB now: ${totalNow}`);

  await prisma.$disconnect();
  process.exit(0);
})();
