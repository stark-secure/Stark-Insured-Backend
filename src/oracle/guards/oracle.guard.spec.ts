import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OracleGuard } from './oracle.guard';

describe('OracleGuard', () => {
  let guard: OracleGuard;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        ORACLE_PUBLIC_KEY_1: '04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd5b8dec5235a0fa8722476c7709c02559e3aa73aa03918ba2d492eea75abea235',
        ORACLE_PUBLIC_KEY_2: '',
      };
      return config[key] || defaultValue;
    }),
  };

  const createMockExecutionContext = (body: any): ExecutionContext => {
    const mockRequest = {
      body,
      oracleMetadata: undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({}),
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OracleGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<OracleGuard>(OracleGuard);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const validRequestBody = {
      claimId: 1,
      signature: '0x1234567890abcdef',
      eventType: 'wallet_exploit',
      timestamp: new Date().toISOString(),
      verificationData: {
        transactionHash: '0xabc123',
      },
    };

    it('should throw UnauthorizedException for missing signature', async () => {
      const context = createMockExecutionContext({
        claimId: 1,
        eventType: 'wallet_exploit',
        timestamp: new Date().toISOString(),
      });

      await expect(guard.canActivate(context))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for missing claimId', async () => {
      const context = createMockExecutionContext({
        signature: '0x1234567890abcdef',
        eventType: 'wallet_exploit',
        timestamp: new Date().toISOString(),
      });

      await expect(guard.canActivate(context))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for empty body', async () => {
      const context = createMockExecutionContext(null);

      await expect(guard.canActivate(context))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should handle signature verification gracefully', async () => {
      // Mock the private method to simulate signature verification failure
      const context = createMockExecutionContext(validRequestBody);
      
      // Since we can't easily mock the crypto operations, we expect this to fail
      // with signature verification, which should throw UnauthorizedException
      await expect(guard.canActivate(context))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createSignatureMessage', () => {
    it('should create deterministic message without verification data', () => {
      const message1 = guard['createSignatureMessage'](
        1,
        'wallet_exploit',
        '2024-01-15T10:30:00Z'
      );
      const message2 = guard['createSignatureMessage'](
        1,
        'wallet_exploit',
        '2024-01-15T10:30:00Z'
      );

      expect(message1).toBe(message2);
      expect(message1).toBe('1:wallet_exploit:2024-01-15T10:30:00Z');
    });

    it('should create deterministic message with verification data', () => {
      const verificationData = {
        transactionHash: '0xabc123',
        blockNumber: 18500000,
      };

      const message1 = guard['createSignatureMessage'](
        1,
        'wallet_exploit',
        '2024-01-15T10:30:00Z',
        verificationData
      );
      const message2 = guard['createSignatureMessage'](
        1,
        'wallet_exploit',
        '2024-01-15T10:30:00Z',
        verificationData
      );

      expect(message1).toBe(message2);
      expect(message1).toContain('1:wallet_exploit:2024-01-15T10:30:00Z:');
      expect(message1).toContain('blockNumber');
      expect(message1).toContain('transactionHash');
    });

    it('should sort verification data keys for deterministic ordering', () => {
      const verificationData1 = {
        transactionHash: '0xabc123',
        blockNumber: 18500000,
      };
      const verificationData2 = {
        blockNumber: 18500000,
        transactionHash: '0xabc123',
      };

      const message1 = guard['createSignatureMessage'](
        1,
        'wallet_exploit',
        '2024-01-15T10:30:00Z',
        verificationData1
      );
      const message2 = guard['createSignatureMessage'](
        1,
        'wallet_exploit',
        '2024-01-15T10:30:00Z',
        verificationData2
      );

      expect(message1).toBe(message2);
    });
  });

  describe('verifySignatureWithKey', () => {
    it('should handle invalid signature format gracefully', async () => {
      const result = await guard['verifySignatureWithKey'](
        'invalid-signature',
        Buffer.from('test-message'),
        'invalid-public-key'
      );

      expect(result).toBe(false);
    });

    it('should handle signature verification errors gracefully', async () => {
      const result = await guard['verifySignatureWithKey'](
        '0x1234567890abcdef',
        Buffer.from('test-message'),
        '04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd'
      );

      // This should return false due to invalid signature/key combination
      expect(result).toBe(false);
    });
  });
});
