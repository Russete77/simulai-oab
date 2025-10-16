const fs = require('fs');
const path = require('path');

function loadLocal() {
  const localPath = path.resolve(__dirname, '..', 'dataset_complete.json');
  if (!fs.existsSync(localPath)) throw new Error('Local dataset_complete.json not found');
  const raw = fs.readFileSync(localPath, 'utf8');
  return JSON.parse(raw);
}

function normalizeRow(row) {
  // normalize question text and choices order/strings for fair comparison
  const q = (row.question || '').replace(/\s+/g, ' ').trim();
  let choices = row.choices;
  if (!Array.isArray(choices)) {
    if (choices && typeof choices === 'object') {
      // maybe it's a map of labels -> text
      choices = Object.values(choices);
    } else {
      choices = [];
    }
  }
  // choices may be array of strings or array of objects; normalize to strings
  choices = choices.map(c => (typeof c === 'string' ? c : (c.text || JSON.stringify(c))))
    .map(s => (s || '').replace(/\s+/g, ' ').trim());
  // keep original order because alternatives order may matter; join to single string
  return { q, choicesStr: choices.join('||') };
}

function analyze() {
  const data = loadLocal();
  const map = new Map();
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const key = `${row.exam_id}::${row.question_number}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ index: i, row });
  }

  const duplicateGroups = [];
  let identicalCount = 0;
  let differentCount = 0;

  for (const [key, entries] of map.entries()) {
    if (entries.length <= 1) continue;
    // compare normalized forms
    const norms = entries.map(e => normalizeRow(e.row));
    const first = JSON.stringify(norms[0]);
    let allSame = true;
    for (let i = 1; i < norms.length; i++) {
      if (JSON.stringify(norms[i]) !== first) { allSame = false; break; }
    }
    if (allSame) identicalCount++; else differentCount++;
    duplicateGroups.push({ key, count: entries.length, identical: allSame, entries: entries.slice(0,5).map(e=>({ index: e.index, question: e.row.question, choices: e.row.choices })) });
  }

  const report = {
    totalRows: data.length,
    totalUniqueKeys: map.size,
    duplicateGroupsCount: duplicateGroups.length,
    identicalGroups: identicalCount,
    differentGroups: differentCount,
    sampleDifferentGroups: duplicateGroups.filter(g=>!g.identical).slice(0,10),
  };

  fs.writeFileSync(path.resolve(__dirname, '..', 'duplicate_groups_report.json'), JSON.stringify(report, null, 2));
  console.log('Wrote duplicate_groups_report.json');
}

analyze();
