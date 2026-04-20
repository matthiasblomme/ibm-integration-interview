import { useMemo, useState } from 'react';
import questionsData from '../data/questions.json';
import type { Product, Question, Role } from '../types';
import { QuestionCard } from '../components/QuestionCard';
import { Filters, type FilterState } from '../components/Sidebar';
import { createSearchIndex } from '../lib/search';

const questions = questionsData as Question[];
const ALL_PRODUCTS: Product[] = ['MQ', 'ACE', 'Cloud', 'General'];
const ALL_ROLES: Role[] = ['Admin', 'Dev', 'Any'];

export function Browse() {
  const [filters, setFilters] = useState<FilterState>({
    products: [],
    roles: [],
    topics: [],
    query: '',
  });

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
      return true;
    });
  }, [filters, index]);

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
      <p className="muted">
        Showing {results.length} of {questions.length} questions.
      </p>
      {results.map((q) => (
        <QuestionCard key={q.id} q={q} />
      ))}
      {results.length === 0 && <p className="muted">No questions match these filters.</p>}
    </div>
  );
}
