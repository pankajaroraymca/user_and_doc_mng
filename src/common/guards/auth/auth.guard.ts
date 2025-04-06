import { CanActivate, ExecutionContext, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Request } from 'express';
import { Env } from 'src/common/config/env.config';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public/public.decorator';
import { ERROR } from 'src/common/enums/response.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    /**
     * For public routes
     */
    if (isPublic) {
      request['isRoutePublic'] = true
      return true;
    }


    const token = this.extractTokenFromHeader(request);

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get(Env.JWT_SECRET),
      });

      if (!payload?.userId) {
        throw new UnauthorizedException(ERROR.ERROR_INVALID_TOKEN);
      }

      request['user'] = { ...payload, token };

      return true;
    } catch (error) {
      let message = ERROR.ERROR_NO_TOKEN;
      if (error instanceof TokenExpiredError) {
        message = ERROR.ERROR_TOKEN_EXPIRED;
      } else if (error instanceof JsonWebTokenError) {
        message = ERROR.ERROR_INVALID_TOKEN;
      } else {
        message = error?.message || message;
      }

      response.status(HttpStatus.UNAUTHORIZED).json({
        code: HttpStatus.UNAUTHORIZED,
        success: false,
        message: message,
        error: true,
        errorMessage: message,
        result: error,
      });
    }
  }

  /**
   * Extract token from request header authorization
   * @param request Request
   * @returns {string | undefined}
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
