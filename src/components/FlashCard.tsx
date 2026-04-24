import { useState, useEffect, useMemo } from 'react';
import type { Question } from '../types';
import { useAnswerLength } from '../lib/prefs';
import { gradeChoiceAnswer, type Grade } from '../lib/storage';

interface Props {
  q: Question;
  index: number;
  total: number;
  onRate: (rating: 'got-it' | 'unsure' | 'missed') => void;
  onSkip: () => void;
}

export function FlashCard({ q, index, total, onRate, onSkip }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [length] = useAnswerLength();

  const isMcq = q.answerType === 'single' || q.answerType === 'multi';
  const choices = isMcq && Array.isArray(q.choices) ? q.choices : [];

  useEffect(() => {
    setRevealed(false);
    setSelected(new Set());
    setSubmitted(false);
    setGrade(null);
  }, [q.id]);

  const shortBullets = q.answerBulletsShort?.length ? q.answerBulletsShort : null;
  const useShort = length === 'short' && shortBullets !== null;
  const bullets = useShort ? shortBullets : q.answerBullets;
  const showExplanation = !useShort;

  const canSubmit = isMcq && selected.size > 0 && !submitted;

  const submitMcq = () => {
    if (!isMcq || submitted || selected.size === 0) return;
    const g = gradeChoiceAnswer(choices, selected);
    setGrade(g);
    setSubmitted(true);
    setRevealed(true);
  };

  const advanceMcq = () => {
    if (!grade) return;
    const rating = grade === 'correct' ? 'got-it' : grade === 'partial' ? 'unsure' : 'missed';
    onRate(rating);
  };

  const toggleChoice = (i: number) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (q.answerType === 'single') {
        next.clear();
        next.add(i);
      } else {
        if (next.has(i)) next.delete(i);
        else next.add(i);
      }
      return next;
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (isMcq) {
        if (!submitted) {
          if (e.key === 'Enter' && canSubmit) {
            e.preventDefault();
            submitMcq();
          } else if (e.key === 's' || e.key === 'S') {
            e.preventDefault();
            onSkip();
          }
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          advanceMcq();
        }
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
  }, [revealed, onRate, onSkip, isMcq, submitted, canSubmit, grade]);

  const gradeLabel = useMemo(() => {
    if (!grade) return null;
    if (grade === 'correct') return 'Correct';
    if (grade === 'partial') return 'Partially correct';
    return 'Incorrect';
  }, [grade]);

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
            {q.level && <span className={`tag level-${q.level}`}>{q.level}</span>}
            {isMcq && (
              <span className="tag" style={{ marginLeft: 4 }}>
                {q.answerType === 'single' ? 'Single choice' : 'Multi select'}
              </span>
            )}
          </div>
          <h2 style={{ marginBottom: 16 }}>{q.question}</h2>
          {isMcq ? (
            <ul className="choices choices-interactive">
              {choices.map((c, i) => {
                const inputType = q.answerType === 'single' ? 'radio' : 'checkbox';
                const isSelected = selected.has(i);
                const resultClass = submitted
                  ? c.correct
                    ? 'correct'
                    : isSelected
                      ? 'incorrect'
                      : ''
                  : '';
                return (
                  <li key={i} className={resultClass}>
                    <label>
                      <input
                        type={inputType}
                        name={`choice-${q.id}`}
                        checked={isSelected}
                        onChange={() => toggleChoice(i)}
                        disabled={submitted}
                      />{' '}
                      {c.text}
                    </label>
                    {submitted && c.explanation && (
                      <div className="muted" style={{ marginLeft: '1.6rem', marginTop: '0.15rem', fontSize: '0.85rem' }}>
                        {c.explanation}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : revealed ? null : (
            <p className="muted">Think it through, then reveal.</p>
          )}
          {submitted && gradeLabel && (
            <p className={`grade grade-${grade}`} style={{ marginTop: 12 }}>
              <strong>{gradeLabel}.</strong>
            </p>
          )}
          {revealed && (
            <div className="answer">
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
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="quiz-actions">
          {isMcq ? (
            !submitted ? (
              <>
                <button className="primary" onClick={submitMcq} disabled={!canSubmit}>
                  Submit <span className="kbd">Enter</span>
                </button>
                <button onClick={onSkip}>Skip <span className="kbd">S</span></button>
              </>
            ) : (
              <button className="primary" onClick={advanceMcq}>
                Next <span className="kbd">Enter</span>
              </button>
            )
          ) : !revealed ? (
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
