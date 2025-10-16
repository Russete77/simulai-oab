const fs = require('fs');
const path = require('path');

const HUGGINGFACE_API_URL =
  'https://datasets-server.huggingface.co/rows?dataset=russ7/oab_exams_2011_2025_combined&config=default&split=train';

const OUT_DIR = path.resolve(__dirname, '..', 'hf_rows');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);
const PROGRESS_FILE = path.resolve(OUT_DIR, 'progress.json');

async function fetchUrl(url) {
  const headers = {};
  if (process.env.HF_TOKEN) {
    headers['authorization'] = `Bearer ${process.env.HF_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchAndSaveBatch(offset, limit) {
  const url = `${HUGGINGFACE_API_URL}&offset=${offset}&length=${limit}`;
  const data = await fetchUrl(url);
  const rows = (data.rows || []).map(r => r.row);
  const outPath = path.resolve(OUT_DIR, `${offset}.json`);
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));
  return rows.length;
}

function loadLocal() {
  const localPath = path.resolve(__dirname, '..', 'dataset_complete.json');
  if (!fs.existsSync(localPath)) throw new Error('Local dataset_complete.json not found');
  const raw = fs.readFileSync(localPath, 'utf8');
  return JSON.parse(raw);
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

async function main() {
  try {
    const limit = 100;
    // determine resume offset
    let progress = { lastOffset: 0, done: false };
    if (fs.existsSync(PROGRESS_FILE)) {
      try { progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch (e) { /* ignore */ }
    }
    let offset = progress.lastOffset || 0;

    console.log('Resumable fetch starting at offset', offset);

    while (true) {
      try {
        console.log(`Fetching offset=${offset} length=${limit} ...`);
        const n = await fetchAndSaveBatch(offset, limit);
        console.log(`  saved ${n} rows to ${offset}.json`);
        // update progress
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ lastOffset: offset + n }, null, 2));
        if (!n || n === 0) {
          console.log('No more rows returned by remote; finishing fetch.');
          break;
        }
        offset += n;
        // polite delay
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        const msg = (err && err.message) ? err.message : String(err);
        console.warn(`  fetch failed at offset=${offset}: ${msg}`);
        // If 502 or transient, backoff and retry few times
        let retries = 0;
        let success = false;
        while (retries < 5 && !success) {
          const wait = 500 * (retries + 1);
          console.log(`  retry ${retries + 1} after ${wait}ms`);
          await new Promise(r => setTimeout(r, wait));
          try {
            const n = await fetchAndSaveBatch(offset, Math.max(20, Math.floor(limit / Math.pow(2, retries))));
            console.log(`  saved ${n} rows to ${offset}.json (after retry)`);
            fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ lastOffset: offset + n }, null, 2));
            offset += n;
            success = true;
            break;
          } catch (err2) {
            retries++;
            console.warn(`    retry ${retries} failed: ${err2 && err2.message}`);
          }
        }
        if (!success) {
          console.error('Failed to fetch after retries; aborting fetch loop. You can re-run this script to resume.');
          break;
        }
      }
    }

    // Aggregate all saved files
    const files = fs.readdirSync(OUT_DIR).filter(f => f.match(/^[0-9]+\.json$/)).sort((a,b)=> parseInt(a)-parseInt(b));
    const remote = [];
    for (const f of files) {
      const part = JSON.parse(fs.readFileSync(path.resolve(OUT_DIR, f), 'utf8'));
      remote.push(...part);
    }

    console.log('Total remote rows aggregated from saved files:', remote.length);

    // Now compare with local
    const local = loadLocal();
    const localAnalysis = analyzeArray(local);
    const remoteAnalysis = analyzeArray(remote);

    console.log('\nLocal total rows:', localAnalysis.total, 'unique:', localAnalysis.uniqueKeys, 'dupGroups:', localAnalysis.dupGroups);
    console.log('Remote total rows:', remoteAnalysis.total, 'unique:', remoteAnalysis.uniqueKeys, 'dupGroups:', remoteAnalysis.dupGroups);

    // differences in key sets
    const localKeys = new Set(local.map(r => `${r.exam_id}::${r.question_number}`));
    const remoteKeys = new Set(remote.map(r => `${r.exam_id}::${r.question_number}`));
    const onlyLocal = [];
    const onlyRemote = [];
    for (const k of localKeys) if (!remoteKeys.has(k)) onlyLocal.push(k);
    for (const k of remoteKeys) if (!localKeys.has(k)) onlyRemote.push(k);

    console.log('Keys only local:', onlyLocal.length, 'keys only remote:', onlyRemote.length);

    const diffs = [];
    for (const k of remoteKeys) {
      if (!localKeys.has(k)) continue;
      const l0 = (localAnalysis.map.get(k) || [])[0];
      const r0 = (remoteAnalysis.map.get(k) || [])[0];
      if (!l0 || !r0) continue;
      const lStr = JSON.stringify({ q: (l0.row.question||'').trim(), choices: l0.row.choices });
      const rStr = JSON.stringify({ q: (r0.row.question||'').trim(), choices: r0.row.choices });
      if (lStr !== rStr) diffs.push({ key: k, localIndex: l0.index, remoteIndex: r0.index });
      if (diffs.length >= 200) break;
    }

    const report = {
      local: { total: localAnalysis.total, uniqueKeys: localAnalysis.uniqueKeys, duplicateGroups: localAnalysis.dupGroups, duplicateRows: localAnalysis.dupCount },
      remote: { total: remoteAnalysis.total, uniqueKeys: remoteAnalysis.uniqueKeys, duplicateGroups: remoteAnalysis.dupGroups, duplicateRows: remoteAnalysis.dupCount },
      onlyLocalCount: onlyLocal.length,
      onlyRemoteCount: onlyRemote.length,
      onlyLocalSample: onlyLocal.slice(0,50),
      onlyRemoteSample: onlyRemote.slice(0,50),
      contentDifferencesSample: diffs.slice(0,200),
      fetchedFiles: files,
    };

    fs.writeFileSync(path.resolve(__dirname, '..', 'analysis_hf_comparison.json'), JSON.stringify(report, null, 2));
    console.log('Wrote analysis_hf_comparison.json');

  } catch (e) {
    console.error('Fatal error:', e && e.message || e);
    process.exit(1);
  }
}

main();
