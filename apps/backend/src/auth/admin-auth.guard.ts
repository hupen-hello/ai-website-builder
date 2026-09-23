import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as
      | { type?: string; role?: string; sub?: string }
      | undefined;

    if (!user?.sub || user.type !== 'admin' || user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin login required');
    }

    return true;
  }
}
