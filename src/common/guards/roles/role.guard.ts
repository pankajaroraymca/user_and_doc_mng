import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/common/decorators/roles/roles.decorator';
import { USER_ROLES } from 'src/common/enums/database.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the required roles from the route metadata
    const requiredRoles = this.reflector.getAllAndOverride<USER_ROLES[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get the user from the request object
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if the user has one of the required roles
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}