// Unit tests for BusinessLogicExceptionFilter
import { Test, type TestingModule } from "@nestjs/testing"
import { BusinessLogicExceptionFilter, BusinessLogicException } from "../business-logic-exception.filter"
import { createMockArgumentsHost } from "./helpers/mock-arguments-host"
import { ErrorCode } from "../types/filter.types"

describe("BusinessLogicExceptionFilter", () => {
  let filter: BusinessLogicExceptionFilter

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessLogicExceptionFilter],
    }).compile()

    filter = module.get<BusinessLogicExceptionFilter>(BusinessLogicExceptionFilter)
  })

  it("should be defined", () => {
    expect(filter).toBeDefined()
  })

  it("should handle BusinessLogicException with default values", () => {
    const exception = new BusinessLogicException("Business rule violation")
    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Business rule violation",
        error: "BUSINESS_LOGIC_ERROR",
        timestamp: expect.any(String),
        path: "/test-path",
        method: "GET",
      }),
    )
  })

  it("should handle BusinessLogicException with custom values", () => {
    const exception = new BusinessLogicException(
      "Insufficient funds for transaction",
      422,
      ErrorCode.BUSINESS_LOGIC_ERROR,
      {
        currentBalance: 100,
        requiredAmount: 150,
        accountId: "acc_123",
      },
    )

    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(422)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 422,
        message: "Insufficient funds for transaction",
        error: "BUSINESS_LOGIC_ERROR",
        details: {
          currentBalance: 100,
          requiredAmount: 150,
          accountId: "acc_123",
        },
      }),
    )
  })

  it("should handle BusinessLogicException with different error code", () => {
    const exception = new BusinessLogicException("Access denied to resource", 403, ErrorCode.AUTHORIZATION_ERROR, {
      resourceId: "res_456",
      userId: "user_789",
    })

    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(403)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: "Access denied to resource",
        error: "AUTHORIZATION_ERROR",
        details: {
          resourceId: "res_456",
          userId: "user_789",
        },
      }),
    )
  })
})

describe("BusinessLogicException", () => {
  it("should create exception with default values", () => {
    const exception = new BusinessLogicException("Test message")

    expect(exception.message).toBe("Test message")
    expect(exception.statusCode).toBe(400)
    expect(exception.errorCode).toBe(ErrorCode.BUSINESS_LOGIC_ERROR)
    expect(exception.details).toBeUndefined()
    expect(exception.name).toBe("BusinessLogicException")
  })

  it("should create exception with custom values", () => {
    const details = { key: "value" }
    const exception = new BusinessLogicException("Custom message", 422, ErrorCode.VALIDATION_ERROR, details)

    expect(exception.message).toBe("Custom message")
    expect(exception.statusCode).toBe(422)
    expect(exception.errorCode).toBe(ErrorCode.VALIDATION_ERROR)
    expect(exception.details).toBe(details)
  })
})
