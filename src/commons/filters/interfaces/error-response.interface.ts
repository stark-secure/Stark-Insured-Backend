// Standardized error response interface
export interface ErrorResponse {
  statusCode: number
  message: string | string[]
  error?: string
  timestamp: string
  path: string
  method: string
  correlationId?: string
  details?: any
}

export interface ValidationErrorDetail {
  field: string
  value: any
  constraints: Record<string, string>
}

export interface DatabaseErrorDetail {
  table?: string
  column?: string
  constraint?: string
  detail?: string
}
