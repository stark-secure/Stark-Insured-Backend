import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { Claim } from './entities/claim.entity';
import { ClaimStatus } from '../claim/enums/claim-status.enum';
import { User } from '../user/entities/user.entity';

export interface ClaimStatusChangeEvent {
  claim: Claim;
  user: User;
  previousStatus: ClaimStatus;
  newStatus: ClaimStatus;
  remarks?: string;
}

@Injectable()
export class ClaimNotificationService {
  private readonly logger = new Logger(ClaimNotificationService.name);

  constructor(private readonly mailService: MailService) {}

  /**
   * Determines if an email should be sent for a status transition
   * Implements the business logic for when notifications should be triggered
   */
  private shouldSendNotification(
    previousStatus: ClaimStatus,
    newStatus: ClaimStatus,
  ): boolean {
    // Don't send notification if status hasn't changed
    if (previousStatus === newStatus) {
      return false;
    }

    // Send notifications for these specific transitions:
    // - PENDING -> APPROVED (claim approved)
    // - PENDING -> REJECTED (claim rejected)
    // - Any status change that involves PENDING, APPROVED, or REJECTED
    return (
      previousStatus === ClaimStatus.PENDING ||
      newStatus === ClaimStatus.APPROVED ||
      newStatus === ClaimStatus.REJECTED
    );
  }

  /**
   * Gets a user-friendly status message based on the status transition
   */
  private getStatusMessage(
    previousStatus: ClaimStatus,
    newStatus: ClaimStatus,
    remarks?: string,
  ): string {
    if (remarks) {
      return remarks;
    }

    switch (newStatus) {
      case ClaimStatus.APPROVED:
        return 'Your claim has been approved and will be processed for payout.';
      case ClaimStatus.REJECTED:
        return 'Your claim has been rejected. Please review the details and contact support if you have questions.';
      case ClaimStatus.PENDING:
        return 'Your claim has been submitted and is under review.';
      default:
        return 'Your claim status has been updated.';
    }
  }

  /**
   * Sends email notification for claim status change
   * Handles all status transitions with proper error handling and logging
   */
  async sendClaimStatusNotification(
    event: ClaimStatusChangeEvent,
  ): Promise<void> {
    const { claim, user, previousStatus, newStatus, remarks } = event;

    // Check if notification should be sent
    if (!this.shouldSendNotification(previousStatus, newStatus)) {
      this.logger.debug(
        `Skipping notification for claim ${claim.id}: ${previousStatus} -> ${newStatus} (no notification required)`,
      );
      return;
    }

    // Validate user email
    if (!user.email) {
      this.logger.warn(
        `Cannot send notification for claim ${claim.id}: User ${user.id} has no email address`,
        {
          claimId: claim.id,
          userId: user.id,
          previousStatus,
          newStatus,
        },
      );
      return;
    }

    // Validate email format (basic check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      this.logger.warn(
        `Cannot send notification for claim ${claim.id}: Invalid email format for user ${user.id}`,
        {
          claimId: claim.id,
          userId: user.id,
          userEmail: user.email,
          previousStatus,
          newStatus,
        },
      );
      return;
    }

    const statusMessage = this.getStatusMessage(previousStatus, newStatus, remarks);

    try {
      await this.mailService.sendClaimUpdateEmail(user.email, {
        firstName: user.firstName,
        claimId: claim.id,
        status: newStatus,
        remarks: statusMessage,
      });

      this.logger.log(
        `Claim status notification sent successfully for claim ${claim.id} to ${user.email}`,
        {
          claimId: claim.id,
          userId: user.id,
          userEmail: user.email,
          previousStatus,
          newStatus,
          statusMessage,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send claim status notification for claim ${claim.id} to ${user.email}: ${error.message}`,
        {
          claimId: claim.id,
          userId: user.id,
          userEmail: user.email,
          previousStatus,
          newStatus,
          statusMessage,
          error: error.message,
          stack: error.stack,
        },
      );

      // Don't throw the error to avoid crashing the application
      // The notification failure shouldn't prevent the claim update
      // In a production environment, you might want to queue this for retry
    }
  }

  /**
   * Sends notification for claim submission
   * Triggered when a new claim is created
   */
  async sendClaimSubmittedNotification(
    claim: Claim,
    user: User,
  ): Promise<void> {
    if (!user.email) {
      this.logger.warn(
        `Cannot send submission notification for claim ${claim.id}: User ${user.id} has no email address`,
        {
          claimId: claim.id,
          userId: user.id,
        },
      );
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      this.logger.warn(
        `Cannot send submission notification for claim ${claim.id}: Invalid email format for user ${user.id}`,
        {
          claimId: claim.id,
          userId: user.id,
          userEmail: user.email,
        },
      );
      return;
    }

    try {
      await this.mailService.sendClaimUpdateEmail(user.email, {
        firstName: user.firstName,
        claimId: claim.id,
        status: ClaimStatus.PENDING,
        remarks: 'Your claim has been submitted and is under review. We will notify you once the review is complete.',
      });

      this.logger.log(
        `Claim submission notification sent successfully for claim ${claim.id} to ${user.email}`,
        {
          claimId: claim.id,
          userId: user.id,
          userEmail: user.email,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send claim submission notification for claim ${claim.id} to ${user.email}: ${error.message}`,
        {
          claimId: claim.id,
          userId: user.id,
          userEmail: user.email,
          error: error.message,
          stack: error.stack,
        },
      );
    }
  }

  /**
   * Sends notification for claim processing completion
   * Triggered when oracle processing completes
   */
  async sendClaimProcessingNotification(
    claim: Claim,
    user: User,
    oracleVerdict: string,
  ): Promise<void> {
    if (!user.email) {
      this.logger.warn(
        `Cannot send processing notification for claim ${claim.id}: User ${user.id} has no email address`,
        {
          claimId: claim.id,
          userId: user.id,
          oracleVerdict,
        },
      );
      return;
    }

    const statusMessage = `Your claim has been processed by our automated system. The verdict is: ${oracleVerdict}.`;

    try {
      await this.mailService.sendClaimUpdateEmail(user.email, {
        firstName: user.firstName,
        claimId: claim.id,
        status: claim.status,
        remarks: statusMessage,
      });

      this.logger.log(
        `Claim processing notification sent successfully for claim ${claim.id} to ${user.email}`,
        {
          claimId: claim.id,
          userId: user.id,
          userEmail: user.email,
          oracleVerdict,
          finalStatus: claim.status,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send claim processing notification for claim ${claim.id} to ${user.email}: ${error.message}`,
        {
          claimId: claim.id,
          userId: user.id,
          userEmail: user.email,
          oracleVerdict,
          finalStatus: claim.status,
          error: error.message,
          stack: error.stack,
        },
      );
    }
  }
} 