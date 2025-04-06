import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { ERROR } from 'src/common/enums/response.enum';
import { Env } from 'src/common/config/env.config';
import { CustomJwtService } from './jwt.service';

describe('CustomJwtService', () => {
  let customJwtService: CustomJwtService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockJwtSecret = 'test-secret';
  const mockPayload = { userId: '123', username: 'testuser' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomJwtService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockJwtSecret),
          },
        },
      ],
    }).compile();

    customJwtService = module.get<CustomJwtService>(CustomJwtService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('sign', () => {
    it('should sign a payload and return a token', async () => {
      const mockToken = 'mock-jwt-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = customJwtService.sign(mockPayload);

      expect(result).toBe(mockToken);
      expect(jwtService.sign).toHaveBeenCalledWith(mockPayload, {
        secret: mockJwtSecret,
        expiresIn: '12h',
      });
    });
  });

  describe('refreshSign', () => {
    it('should create a refresh token with longer expiration', async () => {
      const mockRefreshToken = 'mock-refresh-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockRefreshToken);

      const result = customJwtService.refreshSign(mockPayload);

      expect(result).toBe(mockRefreshToken);
      expect(jwtService.sign).toHaveBeenCalledWith(mockPayload, {
        secret: mockJwtSecret,
        expiresIn: '30d',
      });
    });
  });

  describe('verifyAsync', () => {
    const mockToken = 'valid-token';

    it('should successfully verify a valid token', async () => {
      const mockDecodedToken = { ...mockPayload, exp: Date.now() / 1000 + 3600 };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockDecodedToken);

      const result = await customJwtService.verifyAsync(mockToken);

      expect(result).toEqual(mockDecodedToken);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
        secret: mockJwtSecret,
      });
    });

    it('should throw UnauthorizedException for expired token', async () => {
    //   const TokenExpiredError = new Error('Token expired');
    //   TokenExpiredError.name = 'TokenExpiredError';

      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue( new UnauthorizedException(ERROR.ERROR_TOKEN_EXPIRED));

      await expect(customJwtService.verifyAsync(mockToken)).rejects.toThrow(
        new UnauthorizedException(ERROR.ERROR_TOKEN_EXPIRED)
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {

      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new UnauthorizedException(ERROR.ERROR_INVALID_TOKEN));

      await expect(customJwtService.verifyAsync(mockToken)).rejects.toThrow(
        new UnauthorizedException(ERROR.ERROR_INVALID_TOKEN)
      );
    });

    it('should throw UnauthorizedException for unknown errors', async () => {
      const unknownError = new Error('Unknown error');

      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(unknownError);

      await expect(customJwtService.verifyAsync(mockToken)).rejects.toThrow(
        new UnauthorizedException('Unknown error')
      );
    });

    
  });
});