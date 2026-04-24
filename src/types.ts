export type Product = 'MQ' | 'ACE' | 'Cloud' | 'General';
export type Role = 'Admin' | 'Dev' | 'Any';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Level = 'junior' | 'medior' | 'senior' | 'any';

export type AnswerType = 'free' | 'single' | 'multi';

export interface Choice {
  text: string;
  correct: boolean;
  /** Optional per-choice feedback, shown after the user submits. */
  explanation?: string;
}

export interface Question {
  id: string;
  product: Product;
  role: Role;
  topic: string;
  question: string;
  answerBullets: string[];
  /** Optional concise bullets shown when the user prefers short answers. */
  answerBulletsShort?: string[];
  answerExplanation: string;
  tags: string[];
  difficulty: Difficulty;
  /** Optional seniority level this question targets. */
  level?: Level;
  /** Optional list of URLs to authoritative sources for this question. */
  references?: string[];
  /**
   * How this question is answered. 'free' (default) uses the existing reveal +
   * self-rate flow. 'single' / 'multi' require `choices` and are auto-graded.
   */
  answerType?: AnswerType;
  choices?: Choice[];
}

export interface Resource {
  title: string;
  url: string;
  product: Product | 'All';
  kind: 'docs' | 'blog' | 'github' | 'book' | 'community' | 'video' | 'pdf';
  note?: string;
}
