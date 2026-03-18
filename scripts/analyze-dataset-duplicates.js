const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'dataset_complete.json');
if (!fs.existsSync(file)) {
  console.error('dataset_complete.json not found at', file);
  process.exit(2);
}

console.log('Reading', file);
const raw = fs.readFileSync(file, 'utf8');
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error('Failed to parse JSON:', e.message);
  process.exit(2);
}

console.log('Total entries in file:', data.length);

const map = new Map();
const duplicates = [];
for (let i = 0; i < data.length; i++) {
  const row = data[i];
  const key = `${row.exam_id}::${row.question_number}`;
  if (map.has(key)) {
    duplicates.push({ key, index: i, firstIndex: map.get(key) });
  } else {
    map.set(key, i);
  }
}

console.log('Unique keys (examId+questionNumber):', map.size);
console.log('Duplicate keys found:', duplicates.length);

if (duplicates.length > 0) {
  console.log('\nFirst 30 duplicate examples (key, firstIndex, duplicateIndex):');
  duplicates.slice(0, 30).forEach(d => console.log(`  ${d.key}  (first: ${d.firstIndex}, dup: ${d.index})`));
}

// Count by exam_id to see distribution
const byExam = {};
for (const row of data) {
  byExam[row.exam_id] = (byExam[row.exam_id] || 0) + 1;
}

const exams = Object.entries(byExam).sort((a,b) => b[1]-a[1]);
console.log('\nTop 10 exam_id by count:');
exams.slice(0,10).forEach(([exam, cnt]) => console.log(`  ${exam}: ${cnt}`));

// Save a small sample file with unique keys (safe, read-only)
const uniqueList = [];
for (const [key, idx] of map.entries()) {
  uniqueList.push({ key, index: idx, exam_id: key.split('::')[0], question_number: parseInt(key.split('::')[1]) });
}

fs.writeFileSync(path.resolve(__dirname, '..', 'analysis_unique_keys_sample.json'), JSON.stringify({ total: data.length, uniqueKeys: map.size, duplicates: duplicates.length, sample: uniqueList.slice(0,200) }, null, 2));
console.log('\nWrote analysis_unique_keys_sample.json with small sample (first 200 unique keys).');

process.exit(0);
