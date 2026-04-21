import { useState } from 'react';
import type { Question } from '../types';
import type { RatingValue } from '../lib/storage';

function prettyUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, '');
    return `${u.hostname}${path}`;
  } catch {
    return url;
  }
}

interface QuestionCardProps {
  q: Question;
  defaultOpen?: boolean;
  rating?: RatingValue;
}

const ratingLabel: Record<RatingValue, string> = {
  'got-it': 'Last marked: got it',
  unsure: 'Last marked: unsure',
  missed: 'Last marked: missed',
};

export function QuestionCard({ q, defaultOpen = false, rating }: QuestionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => setOpen((o) => !o);
  return (
    <div className="card">
      <div
        className="question-header"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <div className="q-text">
          {rating && (
            <span
              className={`status-dot ${rating}`}
              aria-label={ratingLabel[rating]}
              title={ratingLabel[rating]}
            />
          )}
          {q.question}
        </div>
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
          {q.references && q.references.length > 0 && (
            <div className="references">
              <strong>References</strong>
              <ul>
                {q.references.map((url) => (
                  <li key={url}>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {prettyUrl(url)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
