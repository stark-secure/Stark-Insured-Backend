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
    req = { method: 'GET', originalUrl: '/test' };
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

  it('should log method, url, status, and duration on finish', () => {
    middleware.use(req, res, next);
    // Simulate response finish
    res._finish();
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringMatching(/GET \/test 200 \+\d+ms/)
    );
  });

  it('should handle different status codes', () => {
    res.statusCode = 404;
    middleware.use(req, res, next);
    res._finish();
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringMatching(/GET \/test 404 \+\d+ms/)
    );
  });
});
