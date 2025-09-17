// Unit tests for TypeOrmExceptionFilter
import { Test, type TestingModule } from "@nestjs/testing"
import { QueryFailedError, EntityNotFoundError } from "typeorm"
import { TypeOrmExceptionFilter } from "../typeorm-exception.filter"
import { createMockArgumentsHost } from "./helpers/mock-arguments-host"

describe("TypeOrmExceptionFilter", () => {
  let filter: TypeOrmExceptionFilter

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeOrmExceptionFilter],
    }).compile()

    filter = module.get<TypeOrmExceptionFilter>(TypeOrmExceptionFilter)
  })

  it("should be defined", () => {
    expect(filter).toBeDefined()
  })

  it("should handle EntityNotFoundError", () => {
    const exception = new EntityNotFoundError("User", { id: 1 })
    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(404)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: "Entity not found",
        error: "DATABASE_ERROR",
      }),
    )
  })

  it("should handle QueryFailedError with unique constraint violation", () => {
    const driverError = {
      code: "23505",
      constraint: "users_email_unique",
      detail: "Key (email)=(test@example.com) already exists.",
    }

    const exception = new QueryFailedError("INSERT INTO users...", [], driverError)

    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(409)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        message: "Duplicate entry violates unique constraint",
        error: "DATABASE_ERROR",
        details: {
          constraint: "users_email_unique",
          detail: "Key (email)=(test@example.com) already exists.",
        },
      }),
    )
  })

  it("should handle QueryFailedError with foreign key violation", () => {
    const driverError = {
      code: "23503",
      constraint: "fk_user_profile",
      detail: 'Key (user_id)=(999) is not present in table "users".',
    }

    const exception = new QueryFailedError("INSERT INTO profiles...", [], driverError)

    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Foreign key constraint violation",
        error: "DATABASE_ERROR",
        details: {
          constraint: "fk_user_profile",
          detail: 'Key (user_id)=(999) is not present in table "users".',
        },
      }),
    )
  })

  it("should handle QueryFailedError with not null violation", () => {
    const driverError = {
      code: "23502",
      column: "email",
      table: "users",
    }

    const exception = new QueryFailedError("INSERT INTO users...", [], driverError)

    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Required field cannot be null",
        error: "DATABASE_ERROR",
        details: {
          column: "email",
          table: "users",
        },
      }),
    )
  })

  it("should handle QueryFailedError with unknown error code", () => {
    const driverError = {
      code: "99999",
      message: "Unknown database error",
    }

    const exception = new QueryFailedError("SELECT * FROM users...", [], driverError)

    const { host, mockResponse } = createMockArgumentsHost()

    filter.catch(exception, host)

    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: "Database query failed",
        error: "DATABASE_ERROR",
        details: {
          detail: "Unknown database error",
        },
      }),
    )
  })
})
