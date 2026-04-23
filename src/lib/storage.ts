import { z } from 'zod';
import type { Choice } from '../types';

const PROGRESS_KEY = 'ibm-interview-quiz-progress-v1';
const SESSION_KEY = 'ibm-interview-quiz-session-v1';

export type RatingValue = 'got-it' | 'unsure' | 'missed';

const ratingValueSchema = z.enum(['got-it', 'unsure', 'missed']);

const quizProgressSchema = z.object({
  ratings: z.record(z.string(), ratingValueSchema),
  seen: z.record(z.string(), z.number()),
  updatedAt: z.number(),
});

export type QuizProgress = z.infer<typeof quizProgressSchema>;

const empty: QuizProgress = { ratings: {}, seen: {}, updatedAt: Date.now() };

export function loadProgress(): QuizProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...empty };
    const result = quizProgressSchema.safeParse(JSON.parse(raw));
    if (!result.success) return { ...empty };
    return result.data;
  } catch {
    return { ...empty };
  }
}

export function saveProgress(progress: QuizProgress): void {
  try {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ ...progress, updatedAt: Date.now() }),
    );
  } catch {
    // ignore quota errors
  }
}

export function recordRating(
  progress: QuizProgress,
  id: string,
  rating: RatingValue,
): QuizProgress {
  const next: QuizProgress = {
    ratings: { ...progress.ratings, [id]: rating },
    seen: { ...progress.seen, [id]: (progress.seen[id] ?? 0) + 1 },
    updatedAt: Date.now(),
  };
  saveProgress(next);
  return next;
}

export function resetProgress(): QuizProgress {
  saveProgress({ ...empty });
  return { ...empty };
}

const quizSessionStatsSchema = z.object({
  got: z.number(),
  unsure: z.number(),
  missed: z.number(),
  skipped: z.number(),
});

const quizSessionSchema = z.object({
  queueIds: z.array(z.string()).min(1),
  index: z.number().int().nonnegative(),
  stats: quizSessionStatsSchema,
  savedAt: z.number(),
});

export type QuizSessionStats = z.infer<typeof quizSessionStatsSchema>;
export type QuizSession = z.infer<typeof quizSessionSchema>;

export function loadSession(): QuizSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const result = quizSessionSchema.safeParse(JSON.parse(raw));
    if (!result.success) return null;
    if (result.data.index >= result.data.queueIds.length) return null;
    return result.data;
  } catch {
    return null;
  }
}

export function saveSession(session: Omit<QuizSession, 'savedAt'>): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, savedAt: Date.now() }));
  } catch {
    // ignore quota errors
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export type Grade = 'correct' | 'partial' | 'wrong';

/**
 * Grade an auto-graded (single/multi) answer against the choice list.
 *   correct, all correct choices picked, no incorrect ones
 *   partial, at least one correct pick, but some missed or extras
 *   wrong  , no correct picks
 */
export function gradeChoiceAnswer(choices: Choice[], selectedIndices: Set<number>): Grade {
  const correctSet = new Set<number>();
  choices.forEach((c, i) => {
    if (c.correct) correctSet.add(i);
  });
  const pickedCorrect = [...selectedIndices].filter((i) => correctSet.has(i)).length;
  const pickedIncorrect = selectedIndices.size - pickedCorrect;
  if (pickedCorrect === correctSet.size && pickedIncorrect === 0) return 'correct';
  if (pickedCorrect === 0) return 'wrong';
  return 'partial';
}

/**
 * Priority bucket for picking which questions to show next.
 * Lower = higher priority (shown first).
 *   0, previously missed
 *   1, previously unsure
 *   2, never seen
 *   3, previously got it
 */
export function priorityBucket(progress: QuizProgress, id: string): number {
  const rating = progress.ratings[id];
  if (rating === 'missed') return 0;
  if (rating === 'unsure') return 1;
  if (!progress.seen[id]) return 2;
  return 3; // got-it
}
