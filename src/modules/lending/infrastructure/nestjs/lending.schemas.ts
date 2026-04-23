import { z } from 'zod';

export const borrowBookBodySchema = z.object({
  memberId: z.string().min(1),
  bookId: z.string().min(1),
});

export const loanIdParamSchema = z.object({
  loanId: z.string().min(1),
});

export const memberIdParamSchema = z.object({
  memberId: z.string().min(1),
});

export type BorrowBookBody = z.infer<typeof borrowBookBodySchema>;
export type LoanIdParam = z.infer<typeof loanIdParamSchema>;
export type MemberIdParam = z.infer<typeof memberIdParamSchema>;
