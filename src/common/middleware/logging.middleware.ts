import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, headers } = req;
    const start = Date.now();
    // Support correlation ID if present
    const correlationId = headers['x-correlation-id'] || headers['x-request-id'] || undefined;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      // Structured JSON log for better parsing
      const logPayload = {
        method,
        url: originalUrl,
        status: statusCode,
        durationMs: duration,
        correlationId,
        timestamp: new Date().toISOString(),
      };
      this.logger.log(JSON.stringify(logPayload));
    });

    next();
  }
}
