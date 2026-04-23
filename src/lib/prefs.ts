import { useEffect, useState } from 'react';

export type AnswerLength = 'short' | 'long';

const KEY = 'ibm-interview-answer-length-v1';
const EVENT = 'ibm-interview-answer-length-change';

export function getAnswerLength(): AnswerLength {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'short' || v === 'long') return v;
  } catch {
    // ignore
  }
  return 'long';
}

export function setAnswerLength(v: AnswerLength): void {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    // ignore quota errors
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: v }));
}

export function useAnswerLength(): [AnswerLength, (v: AnswerLength) => void] {
  const [value, setValue] = useState<AnswerLength>(() => getAnswerLength());
  useEffect(() => {
    const handler = (e: Event) => setValue((e as CustomEvent<AnswerLength>).detail);
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);
  return [value, setAnswerLength];
}
