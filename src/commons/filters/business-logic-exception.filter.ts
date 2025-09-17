// Business Logic Exception Filter for handling custom business exceptions
import { Catch, type ArgumentsHost } from "@nestjs/common"
import type { Request, Response } from "express"
import { BaseExceptionFilter } from "./base/base-exception.filter"
import { ErrorCode } from "./types/filter.types"

// Custom business logic exception class
export class BusinessLogicException extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
    public readonly errorCode: ErrorCode = ErrorCode.BUSINESS_LOGIC_ERROR,
    public readonly details?: any,
  ) {
    super(message)
    this.name = "BusinessLogicException"
  }
}

@Catch(BusinessLogicException)
export class BusinessLogicExceptionFilter extends BaseExceptionFilter {
  catch(exception: BusinessLogicException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const errorResponse = this.createErrorResponse(
      exception.statusCode,
      exception.message,
      request,
      exception.errorCode,
      exception.details,
    )

    this.logError(exception, request, errorResponse)
    this.sendErrorResponse(response, errorResponse)
  }
}
