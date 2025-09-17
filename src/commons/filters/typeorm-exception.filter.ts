// TypeORM Exception Filter for handling database-related errors
import { Catch, type ArgumentsHost, HttpStatus } from "@nestjs/common"
import type { Request, Response } from "express"
import { QueryFailedError, EntityNotFoundError, CannotCreateEntityIdMapError } from "typeorm"
import { BaseExceptionFilter } from "./base/base-exception.filter"
import type { DatabaseErrorDetail } from "./interfaces/error-response.interface"
import { ErrorCode } from "./types/filter.types"

@Catch(QueryFailedError, EntityNotFoundError, CannotCreateEntityIdMapError)
export class TypeOrmExceptionFilter extends BaseExceptionFilter {
  catch(exception: QueryFailedError | EntityNotFoundError | CannotCreateEntityIdMapError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status: number
    let message: string
    let details: DatabaseErrorDetail = {}

    if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND
      message = "Entity not found"
    } else if (exception instanceof CannotCreateEntityIdMapError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY
      message = "Cannot create entity ID map"
    } else if (exception instanceof QueryFailedError) {
      const {
        status: queryStatus,
        message: queryMessage,
        details: queryDetails,
      } = this.handleQueryFailedError(exception)
      status = queryStatus
      message = queryMessage
      details = queryDetails
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message = "Database operation failed"
    }

    const errorResponse = this.createErrorResponse(status, message, request, ErrorCode.DATABASE_ERROR, details)

    this.logError(exception, request, errorResponse)
    this.sendErrorResponse(response, errorResponse)
  }

  private handleQueryFailedError(exception: QueryFailedError): {
    status: number
    message: string
    details: DatabaseErrorDetail
  } {
    const error = exception.driverError as any
    const details: DatabaseErrorDetail = {}

    // PostgreSQL error codes
    switch (error.code) {
      case "23505": // unique_violation
        details.constraint = error.constraint
        details.detail = error.detail
        return {
          status: HttpStatus.CONFLICT,
          message: "Duplicate entry violates unique constraint",
          details,
        }

      case "23503": // foreign_key_violation
        details.constraint = error.constraint
        details.detail = error.detail
        return {
          status: HttpStatus.BAD_REQUEST,
          message: "Foreign key constraint violation",
          details,
        }

      case "23502": // not_null_violation
        details.column = error.column
        details.table = error.table
        return {
          status: HttpStatus.BAD_REQUEST,
          message: "Required field cannot be null",
          details,
        }

      case "23514": // check_violation
        details.constraint = error.constraint
        return {
          status: HttpStatus.BAD_REQUEST,
          message: "Check constraint violation",
          details,
        }

      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "Database query failed",
          details: { detail: error.message },
        }
    }
  }
}
