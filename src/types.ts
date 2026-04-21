export type Product = 'MQ' | 'ACE' | 'Cloud' | 'General';
export type Role = 'Admin' | 'Dev' | 'Any';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  product: Product;
  role: Role;
  topic: string;
  question: string;
  answerBullets: string[];
  answerExplanation: string;
  tags: string[];
  difficulty: Difficulty;
  /** Optional list of URLs to authoritative sources for this question. */
  references?: string[];
}

export interface Resource {
  title: string;
  url: string;
  product: Product | 'All';
  kind: 'docs' | 'blog' | 'github' | 'book' | 'community' | 'video' | 'pdf';
  note?: string;
}
