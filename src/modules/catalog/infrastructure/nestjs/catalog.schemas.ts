import { z } from 'zod';

export const addBookBodySchema = z.object({
  isbn: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
});

export type AddBookBody = z.infer<typeof addBookBodySchema>;
