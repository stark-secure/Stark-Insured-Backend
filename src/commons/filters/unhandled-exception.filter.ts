// Unhandled Exception Filter for catching all other exceptions
import { Catch, type ArgumentsHost, HttpStatus } from "@nestjs/common"
import type { Request, Response } from "express"
import { BaseExceptionFilter } from "./base/base-exception.filter"
import { ErrorCode } from "./types/filter.types"

@Catch()
export class UnhandledExceptionFilter extends BaseExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    // Determine if this is a known error type that should be handled differently
    const status = exception.status || exception.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
    const message = exception.message || "Internal server error"

    const errorResponse = this.createErrorResponse(
      status,
      message,
      request,
      ErrorCode.INTERNAL_SERVER_ERROR,
      this.options.includeStack !== false ? { stack: exception.stack } : undefined,
    )

    // Always log unhandled exceptions as errors
    this.logger.error("Unhandled exception caught", {
      correlationId: errorResponse.correlationId,
      path: request.url,
      method: request.method,
      statusCode: status,
      message,
      stack: exception.stack,
      exception: exception.constructor.name,
    })

    this.sendErrorResponse(response, errorResponse)
  }
}
