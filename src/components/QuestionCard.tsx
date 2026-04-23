import { useState } from 'react';
import type { Question } from '../types';
import type { RatingValue } from '../lib/storage';
import { useAnswerLength } from '../lib/prefs';

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
  const [length] = useAnswerLength();
  const toggle = () => setOpen((o) => !o);

  const shortBullets = q.answerBulletsShort?.length ? q.answerBulletsShort : null;
  const useShort = length === 'short' && shortBullets !== null;
  const showShortMissing = length === 'short' && shortBullets === null;
  const bullets = useShort ? shortBullets : q.answerBullets;
  const showExplanation = !useShort;
  const isMcq = q.answerType === 'single' || q.answerType === 'multi';
  const choices = isMcq && q.choices?.length ? q.choices : null;
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
          {showShortMissing && (
            <p className="muted" style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>
              Long answer only, no short version written yet.
            </p>
          )}
          {choices && (
            <ul className="choices">
              {choices.map((c, i) => (
                <li key={i} className={c.correct ? 'correct' : 'incorrect'}>
                  <span className="choice-marker" aria-hidden="true">
                    {c.correct ? '✓' : '·'}
                  </span>
                  {c.text}
                  {c.explanation && <span className="muted">, {c.explanation}</span>}
                </li>
              ))}
            </ul>
          )}
          <ul>
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          {showExplanation && <p>{q.answerExplanation}</p>}
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
