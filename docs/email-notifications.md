# Email Notification System for Claim Status Updates

## Overview

The email notification system automatically sends emails to users when their insurance claim status changes. This improves user communication and engagement by keeping users informed about their claim progress.

## Architecture

### Components

1. **ClaimNotificationService** (`src/claim/notification.service.ts`)
   - Core service responsible for determining when to send notifications
   - Handles email validation and error handling
   - Provides different notification methods for various scenarios

2. **MailService** (`src/mail/mail.service.ts`)
   - Handles actual email delivery using NestJS Mailer
   - Manages email templates and formatting
   - Provides status-specific styling and content

3. **Email Templates** (`src/mail/templates/claim-update.hbs`)
   - Handlebars templates for consistent email formatting
   - Dynamic content based on claim status
   - Responsive design with status-specific colors

## Status Transitions and Notifications

### Triggered Notifications

The system sends email notifications for the following status transitions:

1. **Claim Submission** (`PENDING`)
   - Triggered when a new claim is created
   - Message: "Your claim has been submitted and is under review"

2. **Claim Approval** (`PENDING` → `APPROVED`)
   - Triggered when an admin approves a claim
   - Message: "Your claim has been approved and will be processed for payout"

3. **Claim Rejection** (`PENDING` → `REJECTED`)
   - Triggered when an admin rejects a claim
   - Message: "Your claim has been rejected. Please review the details and contact support if you have questions"

4. **Oracle Processing** (Automated)
   - Triggered when oracle verification completes
   - Message: "Your claim has been processed by our automated system. The verdict is: [verdict]"

### Status Transition Logic

```typescript
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
```

## Email Content and Formatting

### Email Structure

Each notification email includes:

- **Header**: Status-specific color and title
- **Greeting**: Personalized with user's first name
- **Claim Information**: Claim ID and current status
- **Status Message**: Contextual message based on the status transition
- **Additional Information**: Optional remarks or custom messages
- **Action Button**: Link to view claim details
- **Footer**: Company branding and contact information

### Status-Specific Styling

- **PENDING**: Blue theme (#007bff)
- **APPROVED**: Green theme (#28a745)
- **REJECTED**: Red theme (#dc3545)

### Template Variables

```typescript
interface ClaimUpdateEmailData {
  firstName: string;      // User's first name
  claimId: number;        // Claim identifier
  status: string;         // Current claim status
  remarks?: string;       // Optional additional information
  claimUrl?: string;      // Link to claim details
}
```

## Error Handling and Reliability

### Email Validation

The system performs several validation checks before sending emails:

1. **Email Presence**: Checks if user has an email address
2. **Email Format**: Validates email format using regex
3. **User Verification**: Ensures user exists and is active

### Graceful Error Handling

- Email delivery failures don't crash the application
- All errors are logged with comprehensive metadata
- Failed notifications don't prevent claim updates
- Retry mechanisms can be implemented in production

### Logging

Comprehensive logging includes:

```typescript
{
  claimId: number,
  userId: string,
  userEmail: string,
  previousStatus: ClaimStatus,
  newStatus: ClaimStatus,
  statusMessage: string,
  error?: string,
  stack?: string
}
```

## Integration Points

### Claim Service Integration

The notification service is integrated into the claim service at these points:

1. **Claim Creation** (`create` method)
   - Sends submission notification
   - Fetches user details for personalization

2. **Claim Update** (`update` method)
   - Sends status change notification
   - Includes optional remarks from admin

3. **Oracle Processing** (`processClaim` method)
   - Sends processing completion notification
   - Includes oracle verdict information

### Module Dependencies

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Claim]),
    OracleModule,
    MailModule,
    UserModule
  ],
  providers: [ClaimService, ClaimNotificationService],
  exports: [ClaimService, ClaimNotificationService],
})
export class ClaimModule {}
```

## Testing

### Unit Tests

Comprehensive test coverage includes:

- **Status Transition Logic**: Verifies correct notification triggers
- **Email Validation**: Tests email format and presence validation
- **Error Handling**: Ensures graceful failure handling
- **Template Rendering**: Validates email content generation

### Integration Tests

- **Service Integration**: Tests notification service with claim service
- **Database Operations**: Verifies notifications don't interfere with data operations
- **Error Scenarios**: Tests notification failures during claim operations

## Configuration

### Environment Variables

```env
# Email Configuration
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your-email@example.com
MAIL_PASS=your-password
MAIL_FROM=noreply@starkinsured.com

# Frontend URL for claim links
FRONTEND_URL=https://app.starkinsured.com
```

### Email Template Configuration

Templates are located in `src/mail/templates/` and use Handlebars for dynamic content rendering.

## Security Considerations

1. **Email Validation**: Prevents sending to invalid email addresses
2. **User Verification**: Only sends to verified user accounts
3. **Error Logging**: Avoids exposing sensitive information in logs
4. **Rate Limiting**: Consider implementing rate limiting for email sending

## Monitoring and Analytics

### Key Metrics to Track

- Email delivery success rate
- Email open rates
- Click-through rates on claim links
- Notification failure rates by error type
- User engagement with claim updates

### Log Analysis

Monitor logs for:
- Failed email deliveries
- Invalid email addresses
- High notification volumes
- Performance issues

## Future Enhancements

### Potential Improvements

1. **Retry Queue**: Implement persistent retry mechanism for failed emails
2. **Email Preferences**: Allow users to configure notification preferences
3. **SMS Notifications**: Add SMS notifications for critical status changes
4. **Push Notifications**: Integrate with mobile app push notifications
5. **Email Templates**: Add more sophisticated templates with rich content
6. **Analytics**: Track email engagement and optimize content

### Scalability Considerations

- Implement email queuing for high-volume scenarios
- Add email service provider fallbacks
- Consider using dedicated email service (SendGrid, Mailgun, etc.)
- Implement email batching for bulk notifications

## API Documentation

### Swagger Integration

The notification system is integrated with Swagger documentation:

- **Claim Status Flow**: Documents all possible status transitions
- **Email Triggers**: Lists when notifications are sent
- **Error Responses**: Documents notification failure scenarios

### Status Flow Documentation

```
Claim Lifecycle:
1. SUBMITTED → PENDING (Email: Submission confirmation)
2. PENDING → APPROVED (Email: Approval notification)
3. PENDING → REJECTED (Email: Rejection notification)
4. PENDING → PENDING (Oracle processing) → APPROVED/REJECTED (Email: Processing result)
```

## Troubleshooting

### Common Issues

1. **Emails Not Sending**
   - Check SMTP configuration
   - Verify user email addresses
   - Review error logs

2. **Template Rendering Issues**
   - Validate template syntax
   - Check variable availability
   - Test template compilation

3. **Performance Issues**
   - Monitor email service response times
   - Check database query performance
   - Review notification frequency

### Debug Mode

Enable debug logging to troubleshoot notification issues:

```typescript
// In notification service
this.logger.debug(
  `Skipping notification for claim ${claim.id}: ${previousStatus} -> ${newStatus} (no notification required)`,
);
``` 