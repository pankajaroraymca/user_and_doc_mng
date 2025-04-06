import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom param decorator to extract user information from the request object.
 *
 * Usage:
 * Apply this decorator to a method parameter in a NestJS controller to automatically
 * extract user information from the HTTP request object.
 *
 * Example usage:
 * ```
 * @Get('profile')
 * getProfile(@User() user: UserJwtPayload) {
 *   return user; // Returns the user object extracted from the request
 * }
 * ```
 *
 * @param data - Optional data parameter (not used in this decorator).
 * @param ctx - ExecutionContext containing the current request context.
 * @returns The user object extracted from the request, typically stored in `request.user`.
 */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if(request.isRoutePublic){
      throw new BadRequestException("Decorators Conflict")
    }
    return request.user;
  },
);
