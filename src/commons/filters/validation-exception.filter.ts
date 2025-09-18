// Validation Exception Filter for handling validation errors
import { Catch, type ArgumentsHost, BadRequestException } from "@nestjs/common"
import type { Request, Response } from "express"
import { BaseExceptionFilter } from "./base/base-exception.filter"
import type { ValidationErrorDetail } from "./interfaces/error-response.interface"
import { ErrorCode } from "./types/filter.types"

@Catch(BadRequestException)
export class ValidationExceptionFilter extends BaseExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const exceptionResponse = exception.getResponse() as any

    // Check if this is a validation error
    if (this.isValidationError(exceptionResponse)) {
      const validationDetails = this.formatValidationErrors(exceptionResponse.message)

      const errorResponse = this.createErrorResponse(400, "Validation failed", request, ErrorCode.VALIDATION_ERROR, {
        validationErrors: validationDetails,
        totalErrors: validationDetails.length,
      })

      this.logError(exception, request, errorResponse)
      this.sendErrorResponse(response, errorResponse)
    } else {
      // Handle as regular BadRequestException
      const errorResponse = this.createErrorResponse(
        400,
        exceptionResponse.message || "Bad Request",
        request,
        exceptionResponse.error || "Bad Request",
      )

      this.logError(exception, request, errorResponse)
      this.sendErrorResponse(response, errorResponse)
    }
  }

  private isValidationError(exceptionResponse: any): boolean {
    return (
      exceptionResponse &&
      Array.isArray(exceptionResponse.message) &&
      exceptionResponse.message.length > 0 &&
      typeof exceptionResponse.message[0] === "object"
    )
  }

  private formatValidationErrors(validationErrors: any[]): ValidationErrorDetail[] {
    return validationErrors.map((error) => ({
      field: error.property || "unknown",
      value: error.value,
      constraints: error.constraints || {},
    }))
  }
}
