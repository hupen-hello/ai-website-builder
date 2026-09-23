import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { type?: string; sub?: string } | undefined;

    if (!user?.sub || user.type !== 'user') {
      throw new UnauthorizedException('User login required');
    }

    const account = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { status: true },
    });
    if (!account || account.status !== 'Active') {
      throw new UnauthorizedException('User account is inactive');
    }

    return true;
  }
}
