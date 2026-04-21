import { Link } from 'react-router-dom';
import { questions } from '../data/questions';

export function Home() {
  const byProduct = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.product] = (acc[q.product] ?? 0) + 1;
    return acc;
  }, {});
  const byRole = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.role] = (acc[q.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1>IBM Integration Interview Prep</h1>
      <p className="muted">
        Browse, search and quiz yourself on IBM ACE and IBM MQ interview questions (Dev + Admin),
        plus a curated resource list.
      </p>

      <div className="spacer" />
      <h2>At a glance</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{questions.length}</div>
          <div className="label">Total questions</div>
        </div>
        {Object.entries(byProduct).map(([p, n]) => (
          <div className="stat-card" key={p}>
            <div className="value">{n}</div>
            <div className="label">{p}</div>
          </div>
        ))}
        {Object.entries(byRole).map(([r, n]) => (
          <div className="stat-card" key={r}>
            <div className="value">{n}</div>
            <div className="label">Role: {r}</div>
          </div>
        ))}
      </div>

      <div className="spacer" />
      <h2>Get started</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3><Link to="/browse">Browse</Link></h3>
          <p className="muted">Filter by product, role and topic. Expand any card to see the answer.</p>
        </div>
        <div className="stat-card">
          <h3><Link to="/quiz">Quiz</Link></h3>
          <p className="muted">Flashcard mode. Rate yourself after each answer — progress saved locally.</p>
        </div>
        <div className="stat-card">
          <h3><Link to="/resources">Resources</Link></h3>
          <p className="muted">Curated IBM docs, community sites and deep-dive materials.</p>
        </div>
      </div>
    </div>
  );
}
