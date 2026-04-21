// Checks every URL in the `references` arrays of questions.json.
// Reports any that don't respond with 2xx/3xx. Exit code 1 if any failed.
// Run with: npm run check:refs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const questions = JSON.parse(readFileSync(resolve(root, 'src/data/questions.json'), 'utf8'));

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

async function check(url) {
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
    // Some servers return 403/405 for HEAD — fall back to GET.
    if (status === 403 || status === 405 || status === 400) {
      status = await attempt('GET');
    }
    if (status >= 200 && status < 400) return { url, ok: true, status };
    return { url, ok: false, status };
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

const list = [...urls];
console.log(`Checking ${list.length} references (concurrency ${CONCURRENCY}, timeout ${TIMEOUT_MS}ms)…`);
const results = await runPool(list, check, CONCURRENCY);
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
