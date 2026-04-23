// Regenerates interview_questions.md from src/data/questions.json + resources.json.
// Run with: npm run gen:md
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const questions = JSON.parse(readFileSync(resolve(root, 'src/data/questions.json'), 'utf8'));
const resources = JSON.parse(readFileSync(resolve(root, 'src/data/resources.json'), 'utf8'));

const productOrder = ['General', 'MQ', 'ACE', 'Cloud'];
const roleOrder = ['Any', 'Admin', 'Dev'];

function sectionTitle(product, role) {
  if (product === 'General') return 'General';
  if (role === 'Any') return `${product}`;
  return `${product} — ${role}`;
}

function groupKey(q) {
  if (q.product === 'General') return 'General||Any';
  return `${q.product}||${q.role}`;
}

const groups = new Map();
for (const q of questions) {
  const k = groupKey(q);
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(q);
}

const orderedKeys = [...groups.keys()].sort((a, b) => {
  const [pa, ra] = a.split('||');
  const [pb, rb] = b.split('||');
  const pdiff = productOrder.indexOf(pa) - productOrder.indexOf(pb);
  if (pdiff !== 0) return pdiff;
  return roleOrder.indexOf(ra) - roleOrder.indexOf(rb);
});

const out = [];
out.push('# IBM ACE and MQ Interview Questions');
out.push('');
out.push('Generated from `src/data/questions.json` — edit the JSON and run `npm run gen:md`.');
out.push('');
out.push(`**Total questions:** ${questions.length}`);
out.push('');
out.push('## Table of contents');
for (const k of orderedKeys) {
  const [p, r] = k.split('||');
  const t = sectionTitle(p, r);
  const anchor = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const count = groups.get(k).length;
  out.push(`- [${t} (${count})](#${anchor})`);
}
out.push('');

for (const k of orderedKeys) {
  const [p, r] = k.split('||');
  const t = sectionTitle(p, r);
  out.push(`## ${t}`);
  out.push('');
  // group by topic within section
  const byTopic = new Map();
  for (const q of groups.get(k)) {
    if (!byTopic.has(q.topic)) byTopic.set(q.topic, []);
    byTopic.get(q.topic).push(q);
  }
  for (const [topic, list] of byTopic) {
    out.push(`### ${topic}`);
    out.push('');
    for (const q of list) {
      out.push(`**Q: ${q.question}**`);
      out.push('');
      if (Array.isArray(q.choices) && q.choices.length) {
        for (const c of q.choices) {
          const marker = c.correct ? '[x]' : '[ ]';
          const note = c.explanation ? ` — ${c.explanation}` : '';
          out.push(`- ${marker} ${c.text}${note}`);
        }
        out.push('');
      }
      if (Array.isArray(q.answerBulletsShort) && q.answerBulletsShort.length) {
        out.push('_Short answer:_');
        for (const b of q.answerBulletsShort) {
          out.push(`- ${b}`);
        }
        out.push('');
      }
      for (const b of q.answerBullets) {
        out.push(`- ${b}`);
      }
      out.push('');
      out.push(q.answerExplanation);
      out.push('');
      if (Array.isArray(q.references) && q.references.length) {
        out.push('_References:_');
        for (const url of q.references) {
          out.push(`- <${url}>`);
        }
        out.push('');
      }
    }
  }
}

out.push('## Resources');
out.push('');
const byProduct = new Map();
for (const r of resources) {
  if (!byProduct.has(r.product)) byProduct.set(r.product, []);
  byProduct.get(r.product).push(r);
}
for (const [product, list] of byProduct) {
  out.push(`### ${product}`);
  out.push('');
  for (const r of list) {
    const note = r.note ? ` — ${r.note}` : '';
    out.push(`- [${r.title}](${r.url}) _(${r.kind})_${note}`);
  }
  out.push('');
}

writeFileSync(resolve(root, 'interview_questions.md'), out.join('\n'), 'utf8');
console.log(`Wrote interview_questions.md (${questions.length} questions, ${resources.length} resources)`);
