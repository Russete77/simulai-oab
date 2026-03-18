const fs = require('fs');
const path = require('path');

const HUGGINGFACE_API_URL =
  'https://datasets-server.huggingface.co/rows?dataset=russ7/oab_exams_2011_2025_combined&config=default&split=train';

async function fetchBatch(offset = 0, limit = 100) {
  const url = `${HUGGINGFACE_API_URL}&offset=${offset}&length=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.rows.map(r => r.row);
}

async function fetchAllRemote() {
  const all = [];
  let offset = 0;
  let limit = 100; // start conservative
  const minLimit = 20;

  while (true) {
    console.log(`Fetching remote batch offset=${offset} limit=${limit} ...`);
    let batch = null;
    let attempts = 0;
    let currentLimit = limit;

    while (attempts < 3) {
      try {
        batch = await fetchBatch(offset, currentLimit);
        break;
      } catch (err) {
        attempts++;
        const msg = (err && err.message) ? err.message : String(err);
        console.warn(`  fetch attempt ${attempts} failed for offset=${offset} limit=${currentLimit}: ${msg}`);
        // If server responds 422 or similar, reduce batch size and retry
        if (/422|Unprocessable Entity/i.test(msg) && currentLimit > minLimit) {
          currentLimit = Math.max(minLimit, Math.floor(currentLimit / 2));
          console.log(`  reducing batch size to ${currentLimit} and retrying...`);
          await new Promise(r => setTimeout(r, 300));
          continue;
        }
        // other errors: brief backoff and retry
        await new Promise(r => setTimeout(r, 500 * attempts));
      }
    }

    if (!batch) {
      throw new Error(`Unable to fetch batch at offset=${offset} after retries`);
    }

    if (!batch || batch.length === 0) break;
    all.push(...batch);
    offset += batch.length; // advance by actual returned
    // short delay to be polite
    await new Promise(r => setTimeout(r, 150));
  }

  return all;
}

function analyzeArray(arr) {
  const total = arr.length;
  const map = new Map();
  for (let i = 0; i < arr.length; i++) {
    const row = arr[i];
    const key = `${row.exam_id}::${row.question_number}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ index: i, row });
  }
  const uniqueKeys = map.size;
  let dupCount = 0;
  let dupGroups = 0;
  for (const [k, v] of map.entries()) {
    if (v.length > 1) {
      dupGroups++;
      dupCount += v.length - 1;
    }
  }
  return { total, uniqueKeys, dupGroups, dupCount, map };
}

(async function main() {
  try {
    const localPath = path.resolve(__dirname, '..', 'dataset_complete.json');
    if (!fs.existsSync(localPath)) throw new Error('Local file dataset_complete.json not found');
    console.log('Reading local dataset...');
    const localRaw = fs.readFileSync(localPath, 'utf8');
    const local = JSON.parse(localRaw);
    const localAnalysis = analyzeArray(local);

    console.log('Fetching remote dataset from Hugging Face... (this may take a while)');
    const remote = await fetchAllRemote();
    const remoteAnalysis = analyzeArray(remote);

    console.log('\n--- Summary ---');
    console.log('Local total rows:', localAnalysis.total);
    console.log('Local unique keys:', localAnalysis.uniqueKeys);
    console.log('Local duplicate groups:', localAnalysis.dupGroups, 'duplicate rows:', localAnalysis.dupCount);

    console.log('Remote total rows:', remoteAnalysis.total);
    console.log('Remote unique keys:', remoteAnalysis.uniqueKeys);
    console.log('Remote duplicate groups:', remoteAnalysis.dupGroups, 'duplicate rows:', remoteAnalysis.dupCount);

    // Compare key sets
    const localKeys = new Set(local.map(r => `${r.exam_id}::${r.question_number}`));
    const remoteKeys = new Set(remote.map(r => `${r.exam_id}::${r.question_number}`));

    const onlyLocal = [];
    const onlyRemote = [];

    for (const k of localKeys) if (!remoteKeys.has(k)) onlyLocal.push(k);
    for (const k of remoteKeys) if (!localKeys.has(k)) onlyRemote.push(k);

    console.log('\nKeys only in local (count):', onlyLocal.length);
    console.log('Keys only in remote (count):', onlyRemote.length);

    const sampleOnlyLocal = onlyLocal.slice(0, 30);
    const sampleOnlyRemote = onlyRemote.slice(0, 30);

    console.log('\nSample keys only in local:', sampleOnlyLocal.join(', '));
    console.log('\nSample keys only in remote:', sampleOnlyRemote.join(', '));

    // For keys present in both, detect content differences for a few samples
    const diffs = [];
    for (const k of remoteKeys) {
      if (!localKeys.has(k)) continue;
      const localEntries = localAnalysis.map.get(k) || [];
      const remoteEntries = remoteAnalysis.map.get(k) || [];
      // compare first occurrence of each
      const l0 = localEntries[0].row;
      const r0 = remoteEntries[0].row;
      const lStr = JSON.stringify({ q: (l0.question||'').trim(), choices: l0.choices });
      const rStr = JSON.stringify({ q: (r0.question||'').trim(), choices: r0.choices });
      if (lStr !== rStr) {
        diffs.push({ key: k, localIndex: localEntries[0].index, remoteIndex: remoteEntries[0].index });
        if (diffs.length >= 30) break;
      }
    }

    console.log('\nKeys with content differences (sample up to 30):', diffs.length);
    if (diffs.length > 0) console.log(diffs.slice(0,30).map(d => `${d.key} (local:${d.localIndex}, remote:${d.remoteIndex})`).join('\n'));

    const report = {
      local: {
        total: localAnalysis.total,
        uniqueKeys: localAnalysis.uniqueKeys,
        duplicateGroups: localAnalysis.dupGroups,
        duplicateRows: localAnalysis.dupCount,
      },
      remote: {
        total: remoteAnalysis.total,
        uniqueKeys: remoteAnalysis.uniqueKeys,
        duplicateGroups: remoteAnalysis.dupGroups,
        duplicateRows: remoteAnalysis.dupCount,
      },
      onlyLocalCount: onlyLocal.length,
      onlyRemoteCount: onlyRemote.length,
      onlyLocalSample: sampleOnlyLocal,
      onlyRemoteSample: sampleOnlyRemote,
      contentDifferencesSample: diffs.slice(0,200),
    };

    fs.writeFileSync(path.resolve(__dirname, '..', 'analysis_hf_comparison.json'), JSON.stringify(report, null, 2));
    console.log('\nWrote analysis_hf_comparison.json');
  } catch (e) {
    console.error('Fatal error during comparison:', e.message || e);
    process.exit(1);
  }
})();
