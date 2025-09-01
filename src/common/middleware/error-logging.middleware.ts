import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';

@Injectable()
export class ErrorLoggingMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
  ) {}

  use(err: any, req: Request, res: Response, next: NextFunction): void {
    const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] || undefined;
    this.logger.error({
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      correlationId,
      timestamp: new Date().toISOString(),
    });
    next(err);
  }
}
