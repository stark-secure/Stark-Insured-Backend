// HTTP Exception Filter for handling standard HTTP exceptions
import { Catch, type ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common"
import type { Request, Response } from "express"
import { BaseExceptionFilter } from "./base/base-exception.filter"

@Catch(HttpException)
export class HttpExceptionFilter extends BaseExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse()

    let message: string | string[]
    let error: string

    if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any
      message = responseObj.message || exception.message
      error = responseObj.error || HttpStatus[status]
    } else {
      message = exceptionResponse as string
      error = HttpStatus[status]
    }

    const errorResponse = this.createErrorResponse(status, message, request, error)

    this.logError(exception, request, errorResponse)
    this.sendErrorResponse(response, errorResponse)
  }
}
