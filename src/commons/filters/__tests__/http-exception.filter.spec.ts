// Unit tests for HttpExceptionFilter
import { Test, type TestingModule } from "@nestjs/testing"
import { HttpException, HttpStatus } from "@nestjs/common"
import { HttpExceptionFilter } from "../http-exception.filter"
import { createMockArgumentsHost } from "./helpers/mock-arguments-host"

describe("HttpExceptionFilter", () => {
  let filter: HttpExceptionFilter

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile()

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter)
  })

  it("should be defined", () => {
    expect(filter).toBeDefined()
  })

  it("should catch HttpException and format response correctly", () => {
    const exception = new HttpException("Test error message", HttpStatus.BAD_REQUEST)
    const { host, mockResponse, mockRequest } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Test error message",
        error: "Bad Request",
        timestamp: expect.any(String),
        path: "/test-path",
        method: "GET",
        correlationId: expect.any(String),
      }),
    )
  })

  it("should handle HttpException with object response", () => {
    const exceptionResponse = {
      message: ["Field is required", "Field must be valid"],
      error: "Validation Error",
    }
    const exception = new HttpException(exceptionResponse, HttpStatus.UNPROCESSABLE_ENTITY)
    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(422)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 422,
        message: ["Field is required", "Field must be valid"],
        error: "Validation Error",
      }),
    )
  })

  it("should handle HttpException with string response", () => {
    const exception = new HttpException("Simple error message", HttpStatus.FORBIDDEN)
    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(403)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: "Simple error message",
        error: "Forbidden",
      }),
    )
  })

  it("should include correlation ID from request", () => {
    const exception = new HttpException("Test error", HttpStatus.NOT_FOUND)
    const { host, mockResponse, mockRequest } = createMockArgumentsHost()
    mockRequest.correlationId = "test-correlation-id"

    filter.catch(exception, host)

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: "test-correlation-id",
      }),
    )
  })
})
