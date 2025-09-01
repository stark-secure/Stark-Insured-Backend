import { LoggingMiddleware } from './logging.middleware';

const mockLogger = { log: jest.fn() };

jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockImplementation(() => mockLogger),
}));

describe('LoggingMiddleware', () => {
  let middleware: LoggingMiddleware;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new LoggingMiddleware();
    req = { method: 'GET', originalUrl: '/test', headers: {} };
    res = {
      on: jest.fn((event, cb) => {
        if (event === 'finish') {
          res._finish = cb;
        }
      }),
      statusCode: 200,
    };
    next = jest.fn();
    mockLogger.log.mockClear();
  });

  it('should call next()', () => {
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should log structured JSON with method, url, status, duration, and timestamp', () => {
    middleware.use(req, res, next);
    res._finish();
    const logArg = mockLogger.log.mock.calls[0][0];
    const parsed = JSON.parse(logArg);
    expect(parsed.method).toBe('GET');
    expect(parsed.url).toBe('/test');
    expect(parsed.status).toBe(200);
    expect(typeof parsed.durationMs).toBe('number');
    expect(typeof parsed.timestamp).toBe('string');
    expect(parsed.correlationId).toBeUndefined();
  });

  it('should handle different status codes', () => {
    res.statusCode = 404;
    middleware.use(req, res, next);
    res._finish();
    const logArg = mockLogger.log.mock.calls[0][0];
    const parsed = JSON.parse(logArg);
    expect(parsed.status).toBe(404);
  });

  it('should include correlationId if present in headers', () => {
    req.headers['x-correlation-id'] = 'abc-123';
    middleware.use(req, res, next);
    res._finish();
    const logArg = mockLogger.log.mock.calls[0][0];
    const parsed = JSON.parse(logArg);
    expect(parsed.correlationId).toBe('abc-123');
  });
});
