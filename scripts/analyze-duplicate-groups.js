const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'dataset_complete.json');
if (!fs.existsSync(file)) {
  console.error('dataset_complete.json not found at', file);
  process.exit(2);
}

const raw = fs.readFileSync(file, 'utf8');
const data = JSON.parse(raw);

const groups = new Map();
for (let i = 0; i < data.length; i++) {
  const row = data[i];
  const key = `${row.exam_id}::${row.question_number}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push({ index: i, row });
}

let totalGroups = groups.size;
let duplicateGroups = 0;
let identicalGroups = 0;
let differentGroups = 0;
let differentDetails = [];

for (const [key, entries] of groups.entries()) {
  if (entries.length <= 1) continue;
  duplicateGroups++;

  // Compare statements and alternatives
  const statements = entries.map(e => (e.row.question || '').trim());
  const alternativesList = entries.map(e => {
    const ch = e.row.choices;
    if (!ch || !ch.label) return null;
    return JSON.stringify({ labels: ch.label, texts: ch.text });
  });

  const allStatementsEqual = statements.every(s => s === statements[0]);
  const allAlternativesEqual = alternativesList.every(a => a === alternativesList[0]);

  if (allStatementsEqual && allAlternativesEqual) {
    identicalGroups++;
  } else {
    differentGroups++;
    differentDetails.push({ key, count: entries.length, sampleIndices: entries.map(e => e.index).slice(0,10) });
  }
}

console.log('Total groups (unique keys):', totalGroups);
console.log('Groups with duplicates:', duplicateGroups);
console.log('  - identical groups (all fields equal):', identicalGroups);
console.log('  - different groups (same key but content differs):', differentGroups);

if (differentDetails.length > 0) {
  console.log('\nFirst 30 groups with differences (key, duplicateCount, sampleIndices):');
  differentDetails.slice(0,30).forEach(d => console.log(`  ${d.key}  (${d.count})  indices: ${d.sampleIndices.join(',')}`));
}

// Save report
fs.writeFileSync(path.resolve(__dirname, '..', 'analysis_duplicate_groups_report.json'), JSON.stringify({ totalGroups, duplicateGroups, identicalGroups, differentGroups, sampleDifferent: differentDetails.slice(0,200) }, null, 2));
console.log('\nWrote analysis_duplicate_groups_report.json');
process.exit(0);
