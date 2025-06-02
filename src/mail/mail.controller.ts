import { Controller, Post, Body, UseGuards } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { MailService } from "./mail.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { UserRole } from "../user/entities/user.entity"

class SendTestEmailDto {
  email: string
}

@ApiTags("mail")
@Controller("mail")
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Send test email (Admin only)',
    description: 'Send a test email to verify Mailtrap configuration is working correctly'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Test email sent successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required' 
  })
  async sendTestEmail(@Body() emailData: SendTestEmailDto): Promise<{ message: string }> {
    await this.mailService.sendTestEmail(emailData.email);
    return { message: `Test email sent successfully to ${emailData.email}` };
  }
}
