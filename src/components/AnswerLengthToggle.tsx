import { useAnswerLength } from '../lib/prefs';

export function AnswerLengthToggle() {
  const [length, setLength] = useAnswerLength();
  const next = length === 'short' ? 'long' : 'short';
  return (
    <button
      className="ghost"
      onClick={() => setLength(next)}
      title={`Switch to ${next} answers`}
      aria-label={`Switch to ${next} answers`}
      aria-pressed={length === 'short'}
      style={{ width: '100%', marginTop: '0.35rem' }}
    >
      Answers: {length === 'short' ? 'Short' : 'Long'}
    </button>
  );
}
