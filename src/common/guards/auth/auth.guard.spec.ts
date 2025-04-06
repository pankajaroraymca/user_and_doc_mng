import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { ERROR } from 'src/common/enums/response.enum';
import { Env } from 'src/common/config/env.config';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;
  let configService: ConfigService;
  let reflector: Reflector;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    authGuard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (
    isPublic = false, 
    authHeader = 'Bearer valid.token.here'
  ) => {
    const request = { 
      headers: { authorization: authHeader },
      user: null,
      isRoutePublic: false
    };

    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow access for public routes', async () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(true);
      const context = createMockExecutionContext(true);
      const request = context.switchToHttp().getRequest();

      // Act
      const result = await authGuard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(request.isRoutePublic).toBe(true);
    });

    it('should successfully authenticate with valid token', async () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockConfigService.get.mockReturnValue('test-secret');
      mockJwtService.verifyAsync.mockResolvedValue({ 
        userId: '123', 
        email: 'test@example.com' 
      });

      const context = createMockExecutionContext();
      const request = context.switchToHttp().getRequest();

      // Act
      const result = await authGuard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(request.user).toEqual(expect.objectContaining({ 
        userId: '123',
        email: 'test@example.com',
        token: 'valid.token.here'
      }));
    });

    it('should handle token without userId', async () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockConfigService.get.mockReturnValue('test-secret');
      mockJwtService.verifyAsync.mockResolvedValue({});

      const context = createMockExecutionContext();
      const response = context.switchToHttp().getResponse();

      // Act
      await authGuard.canActivate(context);

      // Assert
      expect(response.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
        code: HttpStatus.UNAUTHORIZED,
        success: false,
        message: ERROR.ERROR_INVALID_TOKEN,
        error: true,
        errorMessage: ERROR.ERROR_INVALID_TOKEN,
        result: expect.any(Error),
      }));
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      // Arrange
      const request: any = {
        headers: { authorization: 'Bearer test.token.here' }
      };

      // Act
      const extractMethod = (authGuard as any).extractTokenFromHeader;
      const result = extractMethod(request);

      // Assert
      expect(result).toBe('test.token.here');
    });

    it('should return undefined for invalid authorization header', () => {
      // Arrange
      const request: any = {
        headers: { authorization: 'Invalid test.token.here' }
      };

      // Act
      const extractMethod = (authGuard as any).extractTokenFromHeader;
      const result = extractMethod(request);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined for missing authorization header', () => {
      // Arrange
      const request: any = {
        headers: {}
      };

      // Act
      const extractMethod = (authGuard as any).extractTokenFromHeader;
      const result = extractMethod(request);

      // Assert
      expect(result).toBeUndefined();
    });
  });
});