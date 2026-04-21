const PROGRESS_KEY = 'ibm-interview-quiz-progress-v1';
const SESSION_KEY = 'ibm-interview-quiz-session-v1';

export type RatingValue = 'got-it' | 'unsure' | 'missed';

export interface QuizProgress {
  // questionId -> last rating
  ratings: Record<string, RatingValue>;
  // questionId -> count of times seen
  seen: Record<string, number>;
  updatedAt: number;
}

const empty: QuizProgress = { ratings: {}, seen: {}, updatedAt: Date.now() };

export function loadProgress(): QuizProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...empty };
    const parsed = JSON.parse(raw) as QuizProgress;
    return {
      ratings: parsed.ratings ?? {},
      seen: parsed.seen ?? {},
      updatedAt: parsed.updatedAt ?? Date.now(),
    };
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

export interface QuizSessionStats {
  got: number;
  unsure: number;
  missed: number;
  skipped: number;
}

export interface QuizSession {
  queueIds: string[];
  index: number;
  stats: QuizSessionStats;
  savedAt: number;
}

export function loadSession(): QuizSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuizSession;
    if (!Array.isArray(parsed.queueIds) || parsed.queueIds.length === 0) return null;
    if (parsed.index >= parsed.queueIds.length) return null;
    return parsed;
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

/**
 * Priority bucket for picking which questions to show next.
 * Lower = higher priority (shown first).
 *   0 — previously missed
 *   1 — previously unsure
 *   2 — never seen
 *   3 — previously got it
 */
export function priorityBucket(progress: QuizProgress, id: string): number {
  const rating = progress.ratings[id];
  if (rating === 'missed') return 0;
  if (rating === 'unsure') return 1;
  if (!progress.seen[id]) return 2;
  return 3; // got-it
}
