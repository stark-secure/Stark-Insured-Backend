import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ClaimModule } from '../claim/claim.module';

@Module({
  imports: [ClaimModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {} 