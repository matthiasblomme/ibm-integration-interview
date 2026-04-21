import { z } from 'zod';
import type { Question } from '../types';
import raw from './questions.json';

const questionSchema = z.object({
  id: z.string().min(1),
  product: z.enum(['MQ', 'ACE', 'Cloud', 'General']),
  role: z.enum(['Admin', 'Dev', 'Any']),
  topic: z.string().min(1),
  question: z.string().min(1),
  answerBullets: z.array(z.string()),
  answerExplanation: z.string(),
  tags: z.array(z.string()),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  references: z.array(z.string().url()).optional(),
});

export const questions: Question[] = z.array(questionSchema).parse(raw);
