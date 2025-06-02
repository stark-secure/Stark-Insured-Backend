import { Injectable, Logger } from "@nestjs/common"
import { MailerService } from "@nestjs-modules/mailer"
import { ConfigService } from "@nestjs/config"
import { InjectRepository } from "@nestjs/typeorm"

export interface WelcomeEmailData {
  firstName: string
  email: string
  loginUrl?: string
}

export interface PolicyConfirmationEmailData {
  firstName: string
  policyId: number
  coverageAmount: number
  premium: number
  startDate: Date
  endDate: Date
  policyUrl?: string
}

export interface ClaimUpdateEmailData {
  firstName: string
  claimId: number
  status: string
  claimUrl?: string
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)

   constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: "Welcome to Stark Insured! 🛡️",
        template: "welcome",
        context: {
          ...data,
          frontendUrl: this.configService.get<string>("FRONTEND_URL"),
          loginUrl: data.loginUrl || `${this.configService.get<string>("FRONTEND_URL")}/login`,
        },
      })

      this.logger.log(`Welcome email sent successfully to ${to}`)
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}:`, error)
      throw error
    }
  }

  async sendPolicyConfirmationEmail(to: string, data: PolicyConfirmationEmailData): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: `Policy Confirmation - Coverage #${data.policyId}`,
        template: "policy-confirmation",
        context: {
          ...data,
          frontendUrl: this.configService.get<string>("FRONTEND_URL"),
          policyUrl: data.policyUrl || `${this.configService.get<string>("FRONTEND_URL")}/policies/${data.policyId}`,
          formattedCoverage: new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(data.coverageAmount),
          formattedPremium: new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(data.premium),
          formattedStartDate: data.startDate.toLocaleDateString(),
          formattedEndDate: data.endDate.toLocaleDateString(),
        },
      })

      this.logger.log(`Policy confirmation email sent successfully to ${to}`)
    } catch (error) {
      this.logger.error(`Failed to send policy confirmation email to ${to}:`, error)
      throw error
    }
  }

  async sendClaimUpdateEmail(to: string, data: ClaimUpdateEmailData): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: `Claim Update - Claim #${data.claimId}`,
        template: "claim-update",
        context: {
          ...data,
          frontendUrl: this.configService.get<string>("FRONTEND_URL"),
          claimUrl: data.claimUrl || `${this.configService.get<string>("FRONTEND_URL")}/claims/${data.claimId}`,
          statusColor: this.getStatusColor(data.status),
        },
      })

      this.logger.log(`Claim update email sent successfully to ${to}`)
    } catch (error) {
      this.logger.error(`Failed to send claim update email to ${to}:`, error)
      throw error
    }
  }

  async sendTestEmail(to: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: "Stark Insured - Email Configuration Test ✅",
        template: "test-email",
        context: {
          frontendUrl: this.configService.get<string>("FRONTEND_URL"),
          environment: this.configService.get<string>("NODE_ENV"),
          timestamp: new Date().toISOString(),
        },
      })

      this.logger.log(`Test email sent successfully to ${to}`)
    } catch (error) {
      this.logger.error(`Failed to send test email to ${to}:`, error)
      throw error
    }
  }

  private getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case "approved":
        return "#10b981" // green
      case "rejected":
        return "#ef4444" // red
      case "pending":
        return "#f59e0b" // yellow
      default:
        return "#6b7280" // gray
    }
  }
}
