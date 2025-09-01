import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter for handling HTTP exceptions and standardizing API error responses.
 * It catches all instances of HttpException and formats the response to include
 * statusCode, message, and timestamp for consistent error reporting.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    //private readonly logger = new Logger(HttpExceptionFilter.name);
    /**
     * Catches an HttpException and transforms it into a standardized error response.
     * @param exception The HttpException instance that was caught.
     * @param host The ArgumentsHost object, providing access to the context (e.g., Request, Response).
    */
    catch(exception: HttpException, host: ArgumentsHost) {
        // Get the HTTP context from the arguments host
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

      
        const status =
        exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

       

        // Determine the message for the error response.
        // If errorResponse is an object and has a 'message' property, use that.
        // Otherwise, use the exception's message or a default message.
        const message =
        typeof errorResponse === 'object' && 'message' in errorResponse
            ? (errorResponse as any).message
            : exception.message || 'Internal Server Error';

        // Log error for debugging purposes
        // this.logger.error(
        //     `HTTP ${status} Error: ${message}`,
        //     exception.stack,
        //     `${request.method} ${request.url}`,
        // );
        
        // Send the structured error response
        response.status(status).json({
            statusCode: status,
            message: message,
            timestamp: new Date().toISOString()
        });
    }
}