import { z } from 'zod';
import type { Question } from '../types';
import raw from './questions.json';

const choiceSchema = z.object({
  text: z.string().min(1),
  correct: z.boolean(),
  explanation: z.string().optional(),
});

const questionSchema = z
  .object({
    id: z.string().min(1),
    product: z.enum(['MQ', 'ACE', 'Cloud', 'General']),
    role: z.enum(['Admin', 'Dev', 'Any']),
    topic: z.string().min(1),
    question: z.string().min(1),
    answerBullets: z.array(z.string()),
    answerBulletsShort: z.array(z.string()).max(8).optional(),
    answerExplanation: z.string(),
    tags: z.array(z.string()),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    level: z.enum(['junior', 'medior', 'senior', 'any']).optional(),
    references: z.array(z.string().url()).optional(),
    answerType: z.enum(['free', 'single', 'multi']).optional(),
    choices: z.array(choiceSchema).optional(),
  })
  .refine(
    (q) => {
      if (q.answerType === 'single' || q.answerType === 'multi') {
        return Array.isArray(q.choices) && q.choices.length >= 2 && q.choices.some((c) => c.correct);
      }
      return true;
    },
    {
      message: "Questions with answerType 'single' or 'multi' need at least 2 choices and at least one correct choice.",
      path: ['choices'],
    },
  );

export const questions: Question[] = z.array(questionSchema).parse(raw);
