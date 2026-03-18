const fs = require('fs');
const path = require('path');
const keyToFind = process.argv[2] || '2022-02::3';
const [examId, qnum] = keyToFind.split('::');
const file = path.resolve(__dirname, '..', 'dataset_complete.json');
const raw = fs.readFileSync(file, 'utf8');
const data = JSON.parse(raw);

const matches = data.map((row, idx) => ({row, idx})).filter(x => x.row.exam_id === examId && String(x.row.question_number) === String(qnum));
if (matches.length === 0) {
  console.log('No matches for', keyToFind);
  process.exit(0);
}
console.log(`Found ${matches.length} matches for ${keyToFind}`);
matches.forEach(m => {
  console.log('\n--- INDEX', m.idx, '---');
  console.log(JSON.stringify(m.row, null, 2).slice(0, 2000));
});
console.log('\n(printed truncated JSON for readability)');
