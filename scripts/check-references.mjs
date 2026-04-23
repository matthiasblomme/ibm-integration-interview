// Checks every URL in the `references` arrays of questions.json.
//
// Default mode: reports any that don't respond with 2xx/3xx. Exits 1 on failures.
//   npm run check:refs
//
// Advisory mode: for versioned IBM docs URLs, probes whether a newer-version
// equivalent also resolves. Prints swap suggestions. Always exits 0.
//   npm run advise:refs   (or: node scripts/check-references.mjs --advisory)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const questions = JSON.parse(readFileSync(resolve(root, 'src/data/questions.json'), 'utf8'));

const advisory = process.argv.includes('--advisory');

const urls = new Set();
for (const q of questions) {
  if (Array.isArray(q.references)) {
    for (const u of q.references) urls.add(u);
  }
}

if (urls.size === 0) {
  console.log('No references found.');
  process.exit(0);
}

const TIMEOUT_MS = 15000;
const CONCURRENCY = 8;

// Current supported versions. Bump these as IBM ships new majors — the script
// advises swapping anything older to these, when the same topic also resolves
// under the new version.
const LATEST = {
  'ibm-mq': '9.4',
  'app-connect': '13.0',
};

async function fetchStatus(url) {
  const attempt = async (method) => {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'ace-mq-interview-ref-check/1.0' },
    });
    return res.status;
  };
  try {
    let status = await attempt('HEAD');
    if (status === 403 || status === 405 || status === 400) {
      status = await attempt('GET');
    }
    return { url, status, ok: status >= 200 && status < 400 };
  } catch (err) {
    return { url, ok: false, error: err.message ?? String(err) };
  }
}

async function runPool(items, worker, concurrency) {
  const results = [];
  const queue = [...items];
  const running = new Set();
  while (queue.length || running.size) {
    while (running.size < concurrency && queue.length) {
      const item = queue.shift();
      const p = worker(item).then((r) => {
        results.push(r);
        running.delete(p);
      });
      running.add(p);
    }
    if (running.size) await Promise.race(running);
  }
  return results;
}

// Parse an IBM docs URL of the form
//   https://www.ibm.com/docs/en/<product>/<version>[/<rest>][?query][#hash]
// and return { product, version, rest } or null if it doesn't match.
function parseIbmDocsUrl(url) {
  const m = url.match(/^(https?:\/\/(?:www\.)?ibm\.com\/docs\/en\/)([^/]+)\/([^/?#]+)([/?#].*)?$/);
  if (!m) return null;
  return { base: m[1], product: m[2], version: m[3], rest: m[4] ?? '' };
}

function candidateForLatest(url) {
  const parsed = parseIbmDocsUrl(url);
  if (!parsed) return null;
  const latest = LATEST[parsed.product];
  if (!latest) return null;
  if (parsed.version === latest) return null;
  return `${parsed.base}${parsed.product}/${latest}${parsed.rest}`;
}

const list = [...urls];

if (advisory) {
  // Only probe URLs that have a candidate. For each, HEAD both and advise when
  // both resolve.
  const targets = list
    .map((url) => ({ url, candidate: candidateForLatest(url) }))
    .filter((t) => t.candidate !== null);

  if (targets.length === 0) {
    console.log('No versioned IBM docs URLs with a newer candidate. Nothing to advise.');
    process.exit(0);
  }

  console.log(
    `Advisory: probing ${targets.length} versioned IBM docs URLs against current versions ` +
      `(${Object.entries(LATEST).map(([p, v]) => `${p}=${v}`).join(', ')})…`,
  );

  const allUrls = new Set();
  for (const t of targets) {
    allUrls.add(t.url);
    allUrls.add(t.candidate);
  }
  const results = await runPool([...allUrls], fetchStatus, CONCURRENCY);
  const byUrl = new Map(results.map((r) => [r.url, r]));

  const advisories = [];
  for (const { url, candidate } of targets) {
    const orig = byUrl.get(url);
    const cand = byUrl.get(candidate);
    if (orig?.ok && cand?.ok) {
      advisories.push({ url, candidate });
    }
  }

  advisories.sort((a, b) => a.url.localeCompare(b.url));
  console.log(`\nAdvisories (${advisories.length}):`);
  if (advisories.length === 0) {
    console.log('  (none — either already on latest, or newer-version topic does not resolve)');
  } else {
    for (const a of advisories) {
      console.log(`  ${a.url}\n    → ${a.candidate}`);
    }
  }
  process.exit(0);
}

// Default: reachability check.
console.log(`Checking ${list.length} references (concurrency ${CONCURRENCY}, timeout ${TIMEOUT_MS}ms)…`);
const results = await runPool(list, fetchStatus, CONCURRENCY);
results.sort((a, b) => a.url.localeCompare(b.url));

const failed = results.filter((r) => !r.ok);
const ok = results.length - failed.length;

console.log(`\nOK: ${ok} / ${results.length}`);
if (failed.length) {
  console.log(`\nFailed (${failed.length}):`);
  for (const f of failed) {
    const reason = f.error ? `error: ${f.error}` : `HTTP ${f.status}`;
    console.log(`  ${f.url} — ${reason}`);
  }
  process.exit(1);
}
