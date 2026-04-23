import { z } from 'zod';
import type { Resource } from '../types';
import raw from './resources.json';

const resourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  product: z.enum(['MQ', 'ACE', 'Cloud', 'General', 'All']),
  kind: z.enum(['docs', 'blog', 'github', 'book', 'community', 'video', 'pdf']),
  note: z.string().optional(),
});

export const resources: Resource[] = z.array(resourceSchema).parse(raw);
