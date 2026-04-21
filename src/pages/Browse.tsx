import { useMemo, useState } from 'react';
import { questions } from '../data/questions';
import type { Product, Question, Role } from '../types';
import { QuestionCard } from '../components/QuestionCard';
import { Filters, type FilterState } from '../components/Sidebar';
import { createSearchIndex } from '../lib/search';
import { loadProgress, priorityBucket } from '../lib/storage';

const ALL_PRODUCTS: Product[] = ['MQ', 'ACE', 'Cloud', 'General'];
const ALL_ROLES: Role[] = ['Admin', 'Dev', 'Any'];

export function Browse() {
  const [filters, setFilters] = useState<FilterState>({
    products: [],
    roles: [],
    topics: [],
    query: '',
  });
  const [weakSpotsOnly, setWeakSpotsOnly] = useState(false);
  const [progress] = useState(() => loadProgress());

  const topics = useMemo(() => {
    const set = new Set(questions.map((q) => q.topic));
    return Array.from(set).sort();
  }, []);

  const index = useMemo(() => createSearchIndex(questions), []);

  const results = useMemo(() => {
    let base: Question[];
    if (filters.query.trim()) {
      base = index.search(filters.query).map((r) => r.item);
    } else {
      base = questions;
    }
    return base.filter((q) => {
      if (filters.products.length && !filters.products.includes(q.product)) return false;
      if (filters.roles.length && !filters.roles.includes(q.role)) return false;
      if (filters.topics.length && !filters.topics.includes(q.topic)) return false;
      if (weakSpotsOnly && priorityBucket(progress, q.id) === 3) return false;
      return true;
    });
  }, [filters, index, weakSpotsOnly, progress]);

  return (
    <div>
      <h1>Browse</h1>
      <Filters
        state={filters}
        onChange={setFilters}
        topics={topics}
        allProducts={ALL_PRODUCTS}
        allRoles={ALL_ROLES}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <p className="muted" style={{ margin: 0 }}>
          Showing {results.length} of {questions.length} questions.
        </p>
        <button
          className={weakSpotsOnly ? 'primary' : 'ghost'}
          onClick={() => setWeakSpotsOnly((w) => !w)}
          aria-pressed={weakSpotsOnly}
          title="Hide questions you've already marked 'got it'"
        >
          {weakSpotsOnly ? '✓ ' : ''}Weak spots only
        </button>
      </div>
      {results.map((q) => (
        <QuestionCard key={q.id} q={q} rating={progress.ratings[q.id]} />
      ))}
      {results.length === 0 && <p className="muted">No questions match these filters.</p>}
    </div>
  );
}
