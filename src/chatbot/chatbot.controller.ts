import { Body, Controller, Post } from '@nestjs/common';
import { ChatbotService, ChatMessage, ChatResponse } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  async handleMessage(@Body() message: ChatMessage): Promise<ChatResponse> {
    return this.chatbotService.handleMessage(message);
  }
} 