// Helper function to create mock ArgumentsHost for testing
import type { ArgumentsHost } from "@nestjs/common"
import { jest } from "@jest/globals"

export function createMockArgumentsHost() {
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }

  const mockRequest = {
    url: "/test-path",
    method: "GET",
    ip: "127.0.0.1",
    get: jest.fn().mockReturnValue("test-user-agent"),
    correlationId: undefined,
  }

  const mockHost = {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getRequest: jest.fn().mockReturnValue(mockRequest),
    }),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as unknown as ArgumentsHost

  return {
    host: mockHost,
    mockResponse,
    mockRequest,
  }
}
