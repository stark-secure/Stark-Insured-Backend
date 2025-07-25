import { Injectable, Logger } from '@nestjs/common';
import { ClaimService } from '../claim/claim.service';
import { ConfigService } from '@nestjs/config';
import { Configuration, OpenAIApi } from 'openai';

export interface ChatMessage {
  userId: string;
  message: string;
  timestamp: Date;
}

export interface ChatResponse {
  response: string;
  handoffToHuman?: boolean;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  // Example FAQ map
  private faqs: Record<string, string> = {
    'What is Stark Insured?': 'Stark Insured is a decentralized insurance platform on StarkNet.',
    'How do I file a claim?': 'You can file a claim via the Claims section in your dashboard.',
  };

  constructor(
    private readonly claimService: ClaimService,
    private readonly configService: ConfigService,
  ) {}

  async handleMessage(message: ChatMessage): Promise<ChatResponse> {
    // 1. FAQ match
    const faqAnswer = this.matchFAQ(message.message);
    if (faqAnswer) {
      this.logChat(message, faqAnswer);
      return { response: faqAnswer };
    }

    // 2. Action: Check claim status
    if (/check.*claim status/i.test(message.message)) {
      // Placeholder: In real use, extract claim ID/user info
      const status = await this.claimService.getStatusForUser(message.userId);
      const response = `Your claim status is: ${status}`;
      this.logChat(message, response);
      return { response };
    }

    // 3. Fallback to AI (stub)
    const aiResponse = await this.fallbackToAI(message.message);
    if (aiResponse) {
      this.logChat(message, aiResponse);
      return { response: aiResponse };
    }

    // 4. Handoff to human
    this.logChat(message, 'Handoff to human agent');
    return { response: 'I am transferring you to a live agent.', handoffToHuman: true };
  }

  private matchFAQ(query: string): string | null {
    return this.faqs[query] || null;
  }

  private async fallbackToAI(query: string): Promise<string | null> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) return null;
    const configuration = new Configuration({ apiKey });
    const openai = new OpenAIApi(configuration);
    try {
      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful insurance assistant.' },
          { role: 'user', content: query },
        ],
        max_tokens: 256,
      });
      return completion.data.choices[0]?.message?.content || null;
    } catch (error) {
      this.logger.error('OpenAI error', error);
      return null;
    }
  }

  private logChat(message: ChatMessage, response: string) {
    // Log non-PII chat transcript (could be to DB, file, etc.)
    this.logger.log(`[Chat] User: ${message.userId}, Q: ${message.message}, A: ${response}`);
  }
}

// Add this to the bottom of the file as a patch for integration
// Remove or refactor if ClaimService already has a getStatusForUser method

declare module '../claim/claim.service' {
  interface ClaimService {
    getStatusForUser(userId: string): Promise<string>;
  }
}

ChatbotService.prototype['getStatusForUser'] = async function(userId: string): Promise<string> {
  // Placeholder: Replace with actual claim lookup logic
  // This should call claimService.findClaimsByUserId or similar
  return 'Pending';
}; 