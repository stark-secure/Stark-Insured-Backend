import { LpTokenEventResponseDto } from './lp-token-event-response.dto';

export class PaginatedLpTokenEventResponseDto {
  data: LpTokenEventResponseDto[];
  total: number;
  page: number;
  limit: number;
} 