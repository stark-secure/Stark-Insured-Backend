import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationType } from './entities/notification.entity';
import { Claim } from '../claim/entities/claim.entity';
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
export class NotificationIntegrationService {
  private readonly logger = new Logger(NotificationIntegrationService.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Send real-time notification for claim status changes
   */
  async sendClaimStatusNotification(event: ClaimStatusChangeEvent): Promise<void> {
    const { claim, user, previousStatus, newStatus, remarks } = event;

    // Determine notification type based on status change
    let notificationType: NotificationType;
    let title: string;
    let message: string;

    switch (newStatus) {
      case ClaimStatus.APPROVED:
        notificationType = NotificationType.CLAIM_APPROVED;
        title = 'Claim Approved';
        message = remarks || 'Your claim has been approved and will be processed for payout.';
        break;
      case ClaimStatus.REJECTED:
        notificationType = NotificationType.CLAIM_REJECTED;
        title = 'Claim Rejected';
        message = remarks || 'Your claim has been rejected. Please review the details and contact support if you have questions.';
        break;
      case ClaimStatus.PENDING:
        notificationType = NotificationType.CLAIM_UPDATED;
        title = 'Claim Status Updated';
        message = remarks || 'Your claim status has been updated.';
        break;
      default:
        notificationType = NotificationType.CLAIM_UPDATED;
        title = 'Claim Status Updated';
        message = remarks || 'Your claim status has been updated.';
    }

    try {
      await this.notificationService.createNotification({
        userId: user.id,
        type: notificationType,
        title,
        message,
        metadata: {
          claimId: claim.id,
          previousStatus,
          newStatus,
          claimAmount: claim.amount,
          claimType: claim.type,
        },
      });

      this.logger.log(
        `Real-time notification sent for claim ${claim.id} status change: ${previousStatus} -> ${newStatus}`,
        {
          claimId: claim.id,
          userId: user.id,
          previousStatus,
          newStatus,
          notificationType,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send real-time notification for claim ${claim.id}: ${error.message}`,
        {
          claimId: claim.id,
          userId: user.id,
          previousStatus,
          newStatus,
          error: error.message,
        },
      );
    }
  }

  /**
   * Send real-time notification for claim submission
   */
  async sendClaimSubmittedNotification(claim: Claim, user: User): Promise<void> {
    try {
      await this.notificationService.createNotification({
        userId: user.id,
        type: NotificationType.CLAIM_UPDATED,
        title: 'Claim Submitted',
        message: 'Your claim has been submitted and is under review. We will notify you once the review is complete.',
        metadata: {
          claimId: claim.id,
          claimAmount: claim.amount,
          claimType: claim.type,
        },
      });

      this.logger.log(
        `Real-time notification sent for claim submission ${claim.id}`,
        {
          claimId: claim.id,
          userId: user.id,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send real-time notification for claim submission ${claim.id}: ${error.message}`,
        {
          claimId: claim.id,
          userId: user.id,
          error: error.message,
        },
      );
    }
  }

  /**
   * Send real-time notification for policy creation
   */
  async sendPolicyCreatedNotification(userId: string, policyId: number, policyDetails: any): Promise<void> {
    try {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.POLICY_CREATED,
        title: 'Policy Created',
        message: 'Your insurance policy has been successfully created and is now active.',
        metadata: {
          policyId,
          policyType: policyDetails.type,
          coverageAmount: policyDetails.coverageAmount,
        },
      });

      this.logger.log(`Real-time notification sent for policy creation ${policyId}`, {
        policyId,
        userId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send real-time notification for policy creation ${policyId}: ${error.message}`,
        {
          policyId,
          userId,
          error: error.message,
        },
      );
    }
  }

  /**
   * Send real-time notification for payment received
   */
  async sendPaymentReceivedNotification(userId: string, paymentId: string, amount: number, currency: string): Promise<void> {
    try {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.PAYMENT_RECEIVED,
        title: 'Payment Received',
        message: `Payment of ${amount} ${currency} has been received and processed successfully.`,
        metadata: {
          paymentId,
          amount,
          currency,
        },
      });

      this.logger.log(`Real-time notification sent for payment received ${paymentId}`, {
        paymentId,
        userId,
        amount,
        currency,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send real-time notification for payment received ${paymentId}: ${error.message}`,
        {
          paymentId,
          userId,
          error: error.message,
        },
      );
    }
  }

  /**
   * Send real-time notification for payment failed
   */
  async sendPaymentFailedNotification(userId: string, paymentId: string, amount: number, currency: string, errorMessage: string): Promise<void> {
    try {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.PAYMENT_FAILED,
        title: 'Payment Failed',
        message: `Payment of ${amount} ${currency} has failed. Please try again or contact support.`,
        metadata: {
          paymentId,
          amount,
          currency,
          errorMessage,
        },
      });

      this.logger.log(`Real-time notification sent for payment failed ${paymentId}`, {
        paymentId,
        userId,
        amount,
        currency,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send real-time notification for payment failed ${paymentId}: ${error.message}`,
        {
          paymentId,
          userId,
          error: error.message,
        },
      );
    }
  }

  /**
   * Send system-wide notification
   */
  async sendSystemNotification(title: string, message: string, userIds?: string[]): Promise<void> {
    try {
      if (userIds && userIds.length > 0) {
        // Send to specific users
        await this.notificationService.createNotificationForUsers(
          userIds,
          NotificationType.SYSTEM_ALERT,
          title,
          message,
        );
      } else {
        // Send system notification (could be extended to send to all users)
        await this.notificationService.sendSystemNotification(title, message);
      }

      this.logger.log(`System notification sent: ${title}`, {
        title,
        message,
        userIds,
      });
    } catch (error) {
      this.logger.error(`Failed to send system notification: ${error.message}`, {
        title,
        message,
        error: error.message,
      });
    }
  }
} 