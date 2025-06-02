import { Test, type TestingModule } from "@nestjs/testing"
import { MailerService } from "@nestjs-modules/mailer"
import { ConfigService } from "@nestjs/config"
import { MailService } from "./mail.service"

import { jest } from '@jest/globals'

describe("MailService", () => {
  let service: MailService

  const mockMailerService: any = {
    sendMail: jest.fn(),
  }

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        FRONTEND_URL: "http://localhost:3000",
        NODE_ENV: "test",
      }
      return config[key]
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<MailService>(MailService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })

  describe("sendWelcomeEmail", () => {
    it("should send welcome email successfully", async () => {
      const emailData = {
        firstName: "John",
        email: "john@example.com",
      }

      await service.sendWelcomeEmail("john@example.com", emailData)

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: "john@example.com",
        subject: "Welcome to Stark Insured! 🛡️",
        template: "welcome",
        context: expect.objectContaining({
          firstName: "John",
          email: "john@example.com",
          frontendUrl: "http://localhost:3000",
        }),
      })
    })

    it("should handle email sending errors", async () => {
      const emailData = {
        firstName: "John",
        email: "john@example.com",
      }

      mockMailerService.sendMail.mockRejectedValue(new Error("SMTP Error"))

      await expect(service.sendWelcomeEmail("john@example.com", emailData)).rejects.toThrow("SMTP Error")
    })
  })

  describe("sendTestEmail", () => {
    it("should send test email successfully", async () => {
      await service.sendTestEmail("test@example.com")

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: "test@example.com",
        subject: "Stark Insured - Email Configuration Test ✅",
        template: "test-email",
        context: expect.objectContaining({
          frontendUrl: "http://localhost:3000",
          environment: "test",
        }),
      })
    })
  })
})
