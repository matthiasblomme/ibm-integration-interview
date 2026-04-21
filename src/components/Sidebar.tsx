import type { Product, Role } from '../types';

export interface FilterState {
  products: Product[];
  roles: Role[];
  topics: string[];
  query: string;
}

interface Props {
  state: FilterState;
  onChange: (next: FilterState) => void;
  topics: string[];
  allProducts: Product[];
  allRoles: Role[];
}

export function Filters({ state, onChange, topics, allProducts, allRoles }: Props) {
  const toggle = <T,>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  return (
    <div>
      <div className="filters">
        <div>
          <label htmlFor="filter-search">Search</label>
          <input
            id="filter-search"
            type="search"
            value={state.query}
            placeholder="e.g. RDQM, callable flow, ibmint"
            onChange={(e) => onChange({ ...state, query: e.target.value })}
          />
        </div>
        <div>
          <label>Product</label>
          <div>
            {allProducts.map((p) => (
              <button
                key={p}
                className={state.products.includes(p) ? 'primary' : 'ghost'}
                onClick={() => onChange({ ...state, products: toggle(state.products, p) })}
                style={{ marginRight: 4, marginBottom: 4 }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label>Role</label>
          <div>
            {allRoles.map((r) => (
              <button
                key={r}
                className={state.roles.includes(r) ? 'primary' : 'ghost'}
                onClick={() => onChange({ ...state, roles: toggle(state.roles, r) })}
                style={{ marginRight: 4, marginBottom: 4 }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="filter-topic">Topic</label>
          <select
            id="filter-topic"
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              onChange({ ...state, topics: toggle(state.topics, v) });
            }}
          >
            <option value="">Add topic filter…</option>
            {topics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div style={{ marginTop: 4 }}>
            {state.topics.map((t) => (
              <span
                key={t}
                className="tag"
                role="button"
                tabIndex={0}
                style={{ cursor: 'pointer' }}
                onClick={() => onChange({ ...state, topics: toggle(state.topics, t) })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onChange({ ...state, topics: toggle(state.topics, t) });
                  }
                }}
                aria-label={`Remove topic filter ${t}`}
              >
                {t} ✕
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
