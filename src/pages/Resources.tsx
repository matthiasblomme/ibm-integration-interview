import { useMemo, useState } from 'react';
import resourcesData from '../data/resources.json';
import type { Resource } from '../types';

const resources = resourcesData as Resource[];
const PRODUCTS: (Resource['product'])[] = ['MQ', 'ACE', 'Cloud', 'General', 'All'];

export function Resources() {
  const [filter, setFilter] = useState<Resource['product'] | 'all'>('all');
  const filtered = useMemo(
    () => (filter === 'all' ? resources : resources.filter((r) => r.product === filter)),
    [filter],
  );
  const grouped = useMemo(() => {
    const g: Record<string, Resource[]> = {};
    for (const r of filtered) {
      g[r.product] = g[r.product] ?? [];
      g[r.product].push(r);
    }
    return g;
  }, [filtered]);

  return (
    <div>
      <h1>Resources</h1>
      <p className="muted">Curated IBM docs, GitHub repos, community sites and reference material.</p>
      <div style={{ marginBottom: '1rem' }}>
        <button
          className={filter === 'all' ? 'primary' : 'ghost'}
          onClick={() => setFilter('all')}
          style={{ marginRight: 4 }}
        >
          All
        </button>
        {PRODUCTS.map((p) => (
          <button
            key={p}
            className={filter === p ? 'primary' : 'ghost'}
            onClick={() => setFilter(p)}
            style={{ marginRight: 4 }}
          >
            {p}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([product, list]) => (
        <section key={product} style={{ marginBottom: '1.5rem' }}>
          <h2>{product}</h2>
          <div className="resources-grid">
            {list.map((r) => (
              <div className="card" key={r.url}>
                <div>
                  <span className={`tag product-${r.product}`}>{r.product}</span>
                  <span className="tag">{r.kind}</span>
                </div>
                <h3 style={{ marginTop: 8 }}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer">
                    {r.title}
                  </a>
                </h3>
                {r.note && <p className="muted">{r.note}</p>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
