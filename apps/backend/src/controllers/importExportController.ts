import { Request, Response, NextFunction } from 'express';
import { importService } from '../services/importService.js';
import { exportService } from '../services/exportService.js';
import { ValidationError } from '../utils/errors.js';

export class ImportExportController {
  async importCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      let accountId = req.body?.accountId || (req.query?.accountId as string) || (req.headers['x-account-id'] as string);
      let csvContent = req.body?.csvContent || req.body?.csv || req.body?.csvData;

      // Handle raw body if parsed as string or text/csv
      if (typeof req.body === 'string') {
        csvContent = req.body;
      }

      if (!accountId) {
        throw new ValidationError('Missing required field: accountId');
      }

      if (!csvContent || typeof csvContent !== 'string') {
        throw new ValidationError('Missing required field: csvContent');
      }

      const result = await importService.importCsv(userId, accountId, csvContent, req.ip);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const format = (req.query.format as string)?.toLowerCase() === 'csv' ? 'csv' : 'json';
      const result = await exportService.exportUserData(userId, format, req.ip);

      if (req.headers.accept === 'text/csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.status(200).send(result.data);
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const importExportController = new ImportExportController();
export default importExportController;
