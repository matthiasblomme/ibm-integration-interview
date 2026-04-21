import { useState, useEffect } from 'react';
import type { Question } from '../types';

interface Props {
  q: Question;
  index: number;
  total: number;
  onRate: (rating: 'got-it' | 'unsure' | 'missed') => void;
  onSkip: () => void;
}

export function FlashCard({ q, index, total, onRate, onSkip }: Props) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setRevealed(false);
  }, [q.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (!revealed) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          setRevealed(true);
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          onSkip();
        }
      } else {
        if (e.key === '1') {
          e.preventDefault();
          onRate('got-it');
        } else if (e.key === '2') {
          e.preventDefault();
          onRate('unsure');
        } else if (e.key === '3') {
          e.preventDefault();
          onRate('missed');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [revealed, onRate, onSkip]);

  return (
    <div>
      <div className="quiz-progress">
        <div className="bar" style={{ width: `${((index) / total) * 100}%` }} />
      </div>
      <div className="quiz-card">
        <div>
          <div className="muted" style={{ marginBottom: 8 }}>
            Question {index + 1} of {total}
            <span className="tag product-MQ" style={{ marginLeft: 8 }}>{q.product}</span>
            <span className="tag role">{q.role}</span>
            <span className="tag">{q.topic}</span>
          </div>
          <h2 style={{ marginBottom: 16 }}>{q.question}</h2>
          {revealed ? (
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
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="muted">Think it through, then reveal.</p>
          )}
        </div>
        <div className="quiz-actions">
          {!revealed ? (
            <>
              <button className="primary" onClick={() => setRevealed(true)}>
                Reveal answer <span className="kbd">Space</span>
              </button>
              <button onClick={onSkip}>Skip <span className="kbd">S</span></button>
            </>
          ) : (
            <>
              <button className="primary" onClick={() => onRate('got-it')}>Got it <span className="kbd">1</span></button>
              <button onClick={() => onRate('unsure')}>Unsure <span className="kbd">2</span></button>
              <button onClick={() => onRate('missed')}>Missed <span className="kbd">3</span></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
