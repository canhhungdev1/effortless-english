import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    
    console.log(`[RolesGuard] Protected Route. Required: ${requiredRoles}, UserRole: ${user?.role}`);

    const hasPermission = requiredRoles.some((role) => user?.role === role);
    if (!hasPermission) {
      console.warn(`[RolesGuard] Denied. User ${user?.email} has role ${user?.role} but ${requiredRoles} is required.`);
    }
    return hasPermission;
  }
}
