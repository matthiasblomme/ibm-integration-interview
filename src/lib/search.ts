import Fuse from 'fuse.js';
import type { Question } from '../types';

export function createSearchIndex(questions: Question[]): Fuse<Question> {
  return new Fuse(questions, {
    includeScore: true,
    threshold: 0.35,
    ignoreLocation: true,
    keys: [
      { name: 'question', weight: 3 },
      { name: 'answerBullets', weight: 2 },
      { name: 'answerExplanation', weight: 1.5 },
      { name: 'topic', weight: 2 },
      { name: 'tags', weight: 1.5 },
      { name: 'product', weight: 1 },
      { name: 'role', weight: 1 },
    ],
  });
}
