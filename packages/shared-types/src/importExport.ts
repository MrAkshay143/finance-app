import { z } from 'zod';

export const ImportCsvInputSchema = z.object({
  accountId: z.string().uuid(),
  csvContent: z.string().min(1, 'CSV content must not be empty'),
});
export type ImportCsvInput = z.infer<typeof ImportCsvInputSchema>;

export const ImportCsvResponseSchema = z.object({
  importedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  errors: z.array(z.string()),
});
export type ImportCsvResponse = z.infer<typeof ImportCsvResponseSchema>;

export const ExportUserDataQuerySchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
});
export type ExportUserDataQuery = z.infer<typeof ExportUserDataQuerySchema>;

export const ExportUserDataResponseSchema = z.object({
  data: z.string(),
  format: z.enum(['json', 'csv']),
  filename: z.string(),
  contentType: z.string(),
});
export type ExportUserDataResponse = z.infer<typeof ExportUserDataResponseSchema>;
