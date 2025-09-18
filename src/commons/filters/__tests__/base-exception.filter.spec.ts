// Unit tests for BaseExceptionFilter
import type { ArgumentsHost } from "@nestjs/common"
import { BaseExceptionFilter } from "../base/base-exception.filter"
import { createMockArgumentsHost } from "./helpers/mock-arguments-host"
import { jest } from "@jest/globals" // Import jest to fix undeclared variable error

// Concrete implementation for testing abstract class
class TestExceptionFilter extends BaseExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    const errorResponse = this.createErrorResponse(500, "Test error", request, "TEST_ERROR", {
      testDetail: "test value",
    })

    this.logError(exception, request, errorResponse)
    this.sendErrorResponse(response, errorResponse)
  }
}

describe("BaseExceptionFilter", () => {
  let filter: TestExceptionFilter

  beforeEach(() => {
    filter = new TestExceptionFilter()
  })

  it("should be defined", () => {
    expect(filter).toBeDefined()
  })

  it("should create error response with all fields", () => {
    const { mockRequest } = createMockArgumentsHost()
    mockRequest.correlationId = "test-correlation-id"

    const errorResponse = filter["createErrorResponse"](400, "Test message", mockRequest, "TEST_ERROR", {
      key: "value",
    })

    expect(errorResponse).toEqual({
      statusCode: 400,
      message: "Test message",
      error: "TEST_ERROR",
      timestamp: expect.any(String),
      path: "/test-path",
      method: "GET",
      correlationId: "test-correlation-id",
      details: { key: "value" },
    })
  })

  it("should create error response without optional fields", () => {
    const { mockRequest } = createMockArgumentsHost()

    const errorResponse = filter["createErrorResponse"](404, "Not found", mockRequest)

    expect(errorResponse).toEqual({
      statusCode: 404,
      message: "Not found",
      error: undefined,
      timestamp: expect.any(String),
      path: "/test-path",
      method: "GET",
      correlationId: expect.any(String),
    })
  })

  it("should generate correlation ID when not present in request", () => {
    const { mockRequest } = createMockArgumentsHost()
    mockRequest.correlationId = undefined

    const errorResponse = filter["createErrorResponse"](500, "Server error", mockRequest)

    expect(errorResponse.correlationId).toBeDefined()
    expect(typeof errorResponse.correlationId).toBe("string")
    expect(errorResponse.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })

  it("should send error response correctly", () => {
    const { mockResponse } = createMockArgumentsHost()
    const errorResponse = {
      statusCode: 400,
      message: "Bad request",
      error: "BAD_REQUEST",
      timestamp: new Date().toISOString(),
      path: "/test",
      method: "POST",
      correlationId: "test-id",
    }

    filter["sendErrorResponse"](mockResponse, errorResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith(errorResponse)
  })

  it("should log error with correct format", () => {
    const { mockRequest } = createMockArgumentsHost()
    const exception = new Error("Test exception")
    const errorResponse = {
      statusCode: 500,
      message: "Internal error",
      error: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
      path: "/test",
      method: "GET",
      correlationId: "test-correlation-id",
    }

    const loggerSpy = jest.spyOn(filter["logger"], "error").mockImplementation()

    filter["logError"](exception, mockRequest, errorResponse)

    expect(loggerSpy).toHaveBeenCalledWith({
      correlationId: "test-correlation-id",
      path: "/test",
      method: "GET",
      statusCode: 500,
      message: "Internal error",
      userAgent: "test-user-agent",
      ip: "127.0.0.1",
      stack: exception.stack,
    })

    loggerSpy.mockRestore()
  })

  it("should respect includeStack option", () => {
    const filterWithoutStack = new TestExceptionFilter({ includeStack: false })
    const { mockRequest } = createMockArgumentsHost()
    const exception = new Error("Test exception")
    const errorResponse = {
      statusCode: 500,
      message: "Internal error",
      error: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
      path: "/test",
      method: "GET",
      correlationId: "test-correlation-id",
    }

    const loggerSpy = jest.spyOn(filterWithoutStack["logger"], "error").mockImplementation()

    filterWithoutStack["logError"](exception, mockRequest, errorResponse)

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.not.objectContaining({
        stack: expect.anything(),
      }),
    )

    loggerSpy.mockRestore()
  })
})
