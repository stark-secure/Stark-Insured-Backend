// Unit tests for UnhandledExceptionFilter
import { Test, type TestingModule } from "@nestjs/testing"
import { UnhandledExceptionFilter } from "../unhandled-exception.filter"
import { createMockArgumentsHost } from "./helpers/mock-arguments-host"

describe("UnhandledExceptionFilter", () => {
  let filter: UnhandledExceptionFilter

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnhandledExceptionFilter],
    }).compile()

    filter = module.get<UnhandledExceptionFilter>(UnhandledExceptionFilter)
  })

  it("should be defined", () => {
    expect(filter).toBeDefined()
  })

  it("should handle generic Error", () => {
    const exception = new Error("Unexpected error occurred")
    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: "Unexpected error occurred",
        error: "INTERNAL_SERVER_ERROR",
        timestamp: expect.any(String),
        path: "/test-path",
        method: "GET",
      }),
    )
  })

  it("should handle exception with custom status", () => {
    const exception = {
      status: 418,
      message: "I'm a teapot",
    }

    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(418)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 418,
        message: "I'm a teapot",
        error: "INTERNAL_SERVER_ERROR",
      }),
    )
  })

  it("should handle exception with statusCode property", () => {
    const exception = {
      statusCode: 503,
      message: "Service unavailable",
    }

    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(503)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 503,
        message: "Service unavailable",
        error: "INTERNAL_SERVER_ERROR",
      }),
    )
  })

  it("should include stack trace when includeStack is true", () => {
    const filterWithStack = new UnhandledExceptionFilter({ includeStack: true })
    const exception = new Error("Error with stack")
    const { host, mockResponse } = createMockArgumentsHost()

    filterWithStack.catch(exception, host)

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        details: {
          stack: expect.any(String),
        },
      }),
    )
  })

  it("should not include stack trace when includeStack is false", () => {
    const filterWithoutStack = new UnhandledExceptionFilter({ includeStack: false })
    const exception = new Error("Error without stack")
    const { host, mockResponse } = createMockArgumentsHost()

    filterWithoutStack.catch(exception, host)

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.not.objectContaining({
        details: expect.anything(),
      }),
    )
  })

  it("should handle exception without message", () => {
    const exception = {}
    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: "Internal server error",
        error: "INTERNAL_SERVER_ERROR",
      }),
    )
  })
})
