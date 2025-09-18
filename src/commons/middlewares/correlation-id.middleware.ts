// Middleware to add correlation ID to requests for better tracing
import { Injectable, type NestMiddleware } from "@nestjs/common"
import type { Request, Response, NextFunction } from "express"
import { v4 as uuidv4 } from "uuid"

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = (req.headers["x-correlation-id"] as string) || uuidv4()

    // Add correlation ID to request object
    ;(req as any).correlationId = correlationId

    // Add correlation ID to response headers
    res.setHeader("x-correlation-id", correlationId)

    next()
  }
}
