import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ClaimModule } from '../claim/claim.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, ClaimModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {} 