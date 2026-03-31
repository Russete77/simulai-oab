const fs = require('fs');
const path = require('path');

function loadLocal() {
  const localPath = path.resolve(__dirname, '..', 'dataset_complete.json');
  if (!fs.existsSync(localPath)) throw new Error('Local dataset_complete.json not found');
  const raw = fs.readFileSync(localPath, 'utf8');
  return JSON.parse(raw);
}

function main() {
  const data = loadLocal();
  // Produce dataset_preserve_all.json: add unique_id and original_index
  const preserveAll = data.map((row, idx) => ({
    ...row,
    original_index: idx,
    unique_id: `${row.exam_id}::${row.question_number}::${idx}`
  }));

  // Produce dataset_reindexed.json: for each exam_id, assign sequential question_number_new starting at 1
  const byExam = new Map();
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const exam = row.exam_id || 'unknown';
    if (!byExam.has(exam)) byExam.set(exam, []);
    byExam.get(exam).push({ row, original_index: i });
  }

  const reindexed = [];
  const reindexMap = [];
  for (const [exam, entries] of byExam.entries()) {
    // sort entries by original_index to have stable ordering
    entries.sort((a,b)=>a.original_index - b.original_index);
    let seq = 1;
    for (const e of entries) {
      const newRow = { ...e.row };
      newRow.original_question_number = newRow.question_number;
      newRow.question_number = seq; // reassign sequential numbering
      newRow.original_index = e.original_index;
      newRow.unique_id = `${exam}::${newRow.original_question_number}::${e.original_index}`;
      reindexed.push(newRow);
      reindexMap.push({
        unique_id: newRow.unique_id,
        exam_id: exam,
        original_question_number: newRow.original_question_number,
        original_index: e.original_index,
        new_question_number: seq
      });
      seq++;
    }
  }

  fs.writeFileSync(path.resolve(__dirname, '..', 'dataset_preserve_all.json'), JSON.stringify(preserveAll, null, 2));
  fs.writeFileSync(path.resolve(__dirname, '..', 'dataset_reindexed.json'), JSON.stringify(reindexed, null, 2));
  fs.writeFileSync(path.resolve(__dirname, '..', 'reindex_map.json'), JSON.stringify(reindexMap, null, 2));
  console.log('Wrote dataset_preserve_all.json, dataset_reindexed.json, reindex_map.json');
}

main();
