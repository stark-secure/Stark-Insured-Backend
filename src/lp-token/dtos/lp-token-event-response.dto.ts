import { LPTokenEventType } from '../lp-token-event.entity';

export class LpTokenEventResponseDto {
  id: number;
  userAddress: string;
  amount: number;
  eventType: LPTokenEventType;
  timestamp: Date;
  transactionReference: string;
} 