// Base exception filter with common functionality
import { type ExceptionFilter, type ArgumentsHost, Logger } from "@nestjs/common"
import type { Request, Response } from "express"
import type { ErrorResponse } from "../interfaces/error-response.interface"
import type { FilterOptions } from "../types/filter.types"
import { v4 as uuidv4 } from "uuid"

export abstract class BaseExceptionFilter implements ExceptionFilter {
  protected readonly logger = new Logger(this.constructor.name)

  constructor(protected readonly options: FilterOptions = {}) {}

  abstract catch(exception: any, host: ArgumentsHost): void

  protected createErrorResponse(
    statusCode: number,
    message: string | string[],
    request: Request,
    error?: string,
    details?: any,
  ): ErrorResponse {
    const correlationId = this.getCorrelationId(request)

    return {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      correlationId,
      ...(details && { details }),
    }
  }

  protected sendErrorResponse(response: Response, errorResponse: ErrorResponse): void {
    response.status(errorResponse.statusCode).json(errorResponse)
  }

  protected logError(exception: any, request: Request, errorResponse: ErrorResponse): void {
    const logLevel = this.options.logLevel || "error"
    const includeStack = this.options.includeStack !== false

    const logMessage = {
      correlationId: errorResponse.correlationId,
      path: request.url,
      method: request.method,
      statusCode: errorResponse.statusCode,
      message: errorResponse.message,
      userAgent: request.get("User-Agent"),
      ip: request.ip,
      ...(includeStack && { stack: exception.stack }),
    }

    this.logger[logLevel](logMessage)
  }

  private getCorrelationId(request: Request): string {
    return (request as any).correlationId || uuidv4()
  }
}
