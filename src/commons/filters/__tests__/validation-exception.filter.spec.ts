// Unit tests for ValidationExceptionFilter
import { Test, type TestingModule } from "@nestjs/testing"
import { BadRequestException } from "@nestjs/common"
import { ValidationExceptionFilter } from "../validation-exception.filter"
import { createMockArgumentsHost } from "./helpers/mock-arguments-host"

describe("ValidationExceptionFilter", () => {
  let filter: ValidationExceptionFilter

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidationExceptionFilter],
    }).compile()

    filter = module.get<ValidationExceptionFilter>(ValidationExceptionFilter)
  })

  it("should be defined", () => {
    expect(filter).toBeDefined()
  })

  it("should handle validation errors correctly", () => {
    const validationErrors = [
      {
        property: "email",
        value: "invalid-email",
        constraints: {
          isEmail: "email must be an email",
        },
      },
      {
        property: "age",
        value: -1,
        constraints: {
          min: "age must not be less than 0",
          isNumber: "age must be a number",
        },
      },
    ]

    const exception = new BadRequestException({
      message: validationErrors,
      error: "Bad Request",
    })

    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details: {
          validationErrors: [
            {
              field: "email",
              value: "invalid-email",
              constraints: {
                isEmail: "email must be an email",
              },
            },
            {
              field: "age",
              value: -1,
              constraints: {
                min: "age must not be less than 0",
                isNumber: "age must be a number",
              },
            },
          ],
          totalErrors: 2,
        },
      }),
    )
  })

  it("should handle regular BadRequestException", () => {
    const exception = new BadRequestException("Regular bad request")
    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Regular bad request",
        error: "Bad Request",
      }),
    )
  })

  it("should handle BadRequestException with object response but no validation errors", () => {
    const exception = new BadRequestException({
      message: "Custom bad request message",
      error: "Custom Error",
    })

    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Custom bad request message",
        error: "Custom Error",
      }),
    )
  })
})
