import { useMemo, useState } from 'react';
import questionsData from '../data/questions.json';
import type { Product, Question, Role } from '../types';
import { FlashCard } from '../components/FlashCard';
import { loadProgress, recordRating, resetProgress } from '../lib/storage';

const questions = questionsData as Question[];
const ALL_PRODUCTS: Product[] = ['MQ', 'ACE', 'Cloud', 'General'];
const ALL_ROLES: Role[] = ['Admin', 'Dev', 'Any'];

type Phase = 'configure' | 'run' | 'done';

export function Quiz() {
  const [phase, setPhase] = useState<Phase>('configure');
  const [products, setProducts] = useState<Product[]>(['MQ', 'ACE']);
  const [roles, setRoles] = useState<Role[]>(['Admin', 'Dev', 'Any']);
  const [count, setCount] = useState(10);
  const [shuffle, setShuffle] = useState(true);

  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState({ got: 0, unsure: 0, missed: 0, skipped: 0 });
  const [progress, setProgress] = useState(loadProgress());

  const pool = useMemo(() => {
    return questions.filter((q) => products.includes(q.product) && roles.includes(q.role));
  }, [products, roles]);

  const toggle = <T,>(arr: T[], v: T, setter: (n: T[]) => void) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  function startQuiz() {
    const working = [...pool];
    if (shuffle) {
      for (let i = working.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [working[i], working[j]] = [working[j], working[i]];
      }
    }
    setQueue(working.slice(0, Math.min(count, working.length)));
    setIndex(0);
    setStats({ got: 0, unsure: 0, missed: 0, skipped: 0 });
    setPhase('run');
  }

  function rate(rating: 'got-it' | 'unsure' | 'missed') {
    const current = queue[index];
    setProgress(recordRating(progress, current.id, rating));
    setStats((s) => ({
      ...s,
      got: s.got + (rating === 'got-it' ? 1 : 0),
      unsure: s.unsure + (rating === 'unsure' ? 1 : 0),
      missed: s.missed + (rating === 'missed' ? 1 : 0),
    }));
    advance();
  }

  function skip() {
    setStats((s) => ({ ...s, skipped: s.skipped + 1 }));
    advance();
  }

  function advance() {
    if (index + 1 >= queue.length) {
      setPhase('done');
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (phase === 'configure') {
    return (
      <div>
        <h1>Quiz</h1>
        <p className="muted">
          Pick what to practise. You'll flip through flashcards and rate yourself — progress is saved
          in this browser.
        </p>

        <div className="filters">
          <div>
            <label>Products</label>
            {ALL_PRODUCTS.map((p) => (
              <button
                key={p}
                className={products.includes(p) ? 'primary' : 'ghost'}
                onClick={() => toggle(products, p, setProducts)}
                style={{ marginRight: 4, marginBottom: 4 }}
              >
                {p}
              </button>
            ))}
          </div>
          <div>
            <label>Roles</label>
            {ALL_ROLES.map((r) => (
              <button
                key={r}
                className={roles.includes(r) ? 'primary' : 'ghost'}
                onClick={() => toggle(roles, r, setRoles)}
                style={{ marginRight: 4, marginBottom: 4 }}
              >
                {r}
              </button>
            ))}
          </div>
          <div>
            <label>Number of questions</label>
            <input
              type="text"
              value={count}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!isNaN(n)) setCount(Math.max(1, Math.min(100, n)));
              }}
            />
          </div>
          <div>
            <label>Shuffle</label>
            <button
              className={shuffle ? 'primary' : 'ghost'}
              onClick={() => setShuffle((s) => !s)}
            >
              {shuffle ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <p className="muted">
          {pool.length} questions match your filters. Will draw {Math.min(count, pool.length)}.
        </p>
        <button className="primary" onClick={startQuiz} disabled={pool.length === 0}>
          Start quiz
        </button>
        <button onClick={() => { setProgress(resetProgress()); }} style={{ marginLeft: 8 }}>
          Reset saved progress
        </button>
        <p className="muted" style={{ marginTop: 12 }}>
          Saved progress covers {Object.keys(progress.ratings).length} questions.
        </p>
      </div>
    );
  }

  if (phase === 'run') {
    const current = queue[index];
    return (
      <div>
        <h1>Quiz</h1>
        <FlashCard q={current} index={index} total={queue.length} onRate={rate} onSkip={skip} />
      </div>
    );
  }

  // done
  const total = queue.length;
  return (
    <div>
      <h1>Quiz complete</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{stats.got}</div>
          <div className="label">Got it</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.unsure}</div>
          <div className="label">Unsure</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.missed}</div>
          <div className="label">Missed</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.skipped}</div>
          <div className="label">Skipped</div>
        </div>
        <div className="stat-card">
          <div className="value">
            {total > 0 ? Math.round((stats.got / total) * 100) : 0}%
          </div>
          <div className="label">Confidence score</div>
        </div>
      </div>
      <button className="primary" onClick={() => setPhase('configure')}>
        New quiz
      </button>
    </div>
  );
}
