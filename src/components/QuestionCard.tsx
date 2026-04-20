import { useState } from 'react';
import type { Question } from '../types';

export function QuestionCard({ q, defaultOpen = false }: { q: Question; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card">
      <div className="question-header" onClick={() => setOpen((o) => !o)}>
        <div className="q-text">{q.question}</div>
        <div>
          <span className={`tag product-${q.product}`}>{q.product}</span>
          <span className="tag role">{q.role}</span>
        </div>
      </div>
      <div style={{ marginTop: '0.4rem' }}>
        <span className="tag">{q.topic}</span>
        <span className="tag">{q.difficulty}</span>
        {q.tags.slice(0, 4).map((t) => (
          <span key={t} className="tag">#{t}</span>
        ))}
      </div>
      {open && (
        <div className="answer">
          <ul>
            {q.answerBullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          <p>{q.answerExplanation}</p>
        </div>
      )}
    </div>
  );
}
