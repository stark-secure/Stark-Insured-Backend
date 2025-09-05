import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

/**
 * Global exception filter that standardizes API error responses and logs errors with context.
 * Response shape: { statusCode, message, error?, timestamp, path?, details? }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: WinstonLogger,
    ) {}

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const timestamp = new Date().toISOString();
        const path = request?.originalUrl;

        // Default values
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = 'InternalServerError';
        let details: any = undefined;

        // Handle Nest HttpException and other known shapes
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const resp = exception.getResponse();

            // resp can be string or object (ValidationPipe returns { message: [], error: 'Bad Request' })
            if (typeof resp === 'string') {
                message = resp;
            } else if (typeof resp === 'object' && resp !== null) {
                // Prefer a concise message for users. If validation errors are present, summarize.
                if (Array.isArray((resp as any).message)) {
                    const msgs = (resp as any).message as any[];
                    message = msgs.length === 1 ? msgs[0] : `Validation failed: ${msgs.slice(0, 5).join(', ')}`;
                    details = msgs;
                } else if ((resp as any).message) {
                    message = (resp as any).message;
                } else if ((resp as any).error) {
                    message = (resp as any).error;
                }

                if ((resp as any).error) error = (resp as any).error;
            }
        } else if (exception && exception.status) {
            // Some libraries throw objects with status
            status = exception.status;
            message = exception.message || message;
            error = exception.name || error;
        } else {
            // Unknown exception shape
            message = exception?.message || message;
            error = exception?.name || error;
        }

        // Build standardized response payload
        const payload: any = {
            statusCode: status,
            message,
            error,
            timestamp,
        };

        if (path) payload.path = path;
        if (details) payload.details = details;

        // Server-side logging with context (do not include full stack in response)
        try {
            this.logger.error(message, {
                status,
                error: error || exception?.name,
                path,
                method: request?.method,
                timestamp,
                stack: exception?.stack,
            });
        } catch (logErr) {
            // swallow logging errors to avoid cascading failures
            // fallback to console
            // eslint-disable-next-line no-console
            console.error('Failed to write to logger', logErr);
        }

        response.status(status).json(payload);
    }
}