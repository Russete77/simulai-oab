const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CHUNK_SIZE = 200;

async function loadReindexed() {
  const p = path.resolve(__dirname, '..', 'dataset_reindexed.json');
  if (!fs.existsSync(p)) throw new Error('dataset_reindexed.json not found');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function mapSubject(s) {
  if (!s) return 'GENERAL';
  // Ensure subject is one of the enum values; fallback to GENERAL
  const allowed = new Set(["ETHICS","CONSTITUTIONAL","CIVIL","CIVIL_PROCEDURE","CRIMINAL","CRIMINAL_PROCEDURE","LABOUR","LABOUR_PROCEDURE","ADMINISTRATIVE","TAXES","BUSINESS","CONSUMER","ENVIRONMENTAL","CHILDREN","INTERNATIONAL","HUMAN_RIGHTS","GENERAL"]);
  if (allowed.has(s)) return s;
  // try basic normalization
  const up = s.toUpperCase().replace(/\s+/g,'_');
  if (allowed.has(up)) return up;
  return 'GENERAL';
}

async function main() {
  const data = await loadReindexed();
  console.log('Loaded', data.length, 'rows');

  // fetch existing keys
  console.log('Reading existing question keys from DB...');
  const existingRows = await prisma.$queryRaw`SELECT "examId", "questionNumber" FROM "Question"`;
  const existingSet = new Set(existingRows.map(r => `${r.examId}::${r.questionNumber}`));
  console.log('Existing keys:', existingSet.size);

  const toInsert = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const examId = row.exam_id || row.examId || '';
    const qnum = row.question_number;
    const key = `${examId}::${qnum}`;
    if (!existingSet.has(key)) {
      toInsert.push({ row, index: i, key });
    }
  }

  console.log('Total to insert:', toInsert.length);
  const report = { total: data.length, toInsert: toInsert.length, inserted: 0, skipped: data.length - toInsert.length, failures: [] };

  for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
    const chunk = toInsert.slice(i, i + CHUNK_SIZE);
    console.log(`Processing chunk ${i}/${toInsert.length} (size ${chunk.length})`);
    for (const item of chunk) {
      const row = item.row;
      const examId = row.exam_id || row.examId || '';
      const qnum = row.question_number;
      const examYear = parseInt(row.exam_year || row.examYear || (String(row.exam_id||'').split('-')[0] || '0')) || 0;
      const examPhase = row.exam_phase || row.examPhase || 1;
      const subject = mapSubject(row.question_type || row.questionType || row.subject);
      const statement = row.question || row.statement || '';
      const nullified = !!row.nullified;
      const explanation = row.explanation || null;

      // build alternatives
      const choices = row.choices || {};
      let labels = [];
      let texts = [];
      if (Array.isArray(choices.label)) labels = choices.label;
      if (Array.isArray(choices.text)) texts = choices.text;
      // fallback: sometimes choices may be array of objects
      if ((!labels.length || !texts.length) && Array.isArray(row.choices)) {
        labels = row.choices.map(c => c.label);
        texts = row.choices.map(c => c.text);
      }

      const answerKey = typeof row.answerKey === 'number' ? row.answerKey : (typeof row.answer_key === 'number' ? row.answer_key : null);

      const altCreates = [];
      const n = Math.max(labels.length, texts.length);
      for (let j = 0; j < n; j++) {
        const label = labels[j] || String.fromCharCode(65 + j); // A, B, C
        const text = texts[j] || (Array.isArray(row.choices) && row.choices[j] && (row.choices[j].text||row.choices[j])) || '';
        const isCorrect = (answerKey !== null && j === answerKey) || false;
        altCreates.push({ label: String(label), text: String(text), isCorrect });
      }

      try {
        await prisma.question.create({
          data: {
            examId: String(examId),
            examYear: examYear,
            examPhase: Number(examPhase) || 1,
            questionNumber: Number(qnum),
            subject: subject,
            statement: String(statement || ''),
            explanation: explanation ? String(explanation) : null,
            nullified: nullified,
            difficulty: null,
            averageTime: null,
            successRate: null,
            keywords: [],
            legalReferences: null,
            alternatives: {
              create: altCreates.map(a => ({ label: a.label, text: a.text, isCorrect: a.isCorrect }))
            }
          }
        });
        report.inserted++;
      } catch (err) {
        console.error('Insert failed for', item.index, item.key, err && err.message);
        report.failures.push({ index: item.index, key: item.key, error: err && (err.message || String(err)) });
      }
    }
    // small delay to be polite
    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync(path.resolve(__dirname, '..', 'import_reindexed_run_report.json'), JSON.stringify(report, null, 2));
  console.log('Done. Report written to import_reindexed_run_report.json', report);

  await prisma.$disconnect();
}

main().catch(e=>{ console.error('Fatal', e); prisma.$disconnect(); process.exit(1); });
