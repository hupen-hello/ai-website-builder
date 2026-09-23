import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Get('admin/notifications')
  listForAdmin(@Query('limit') limit?: string) {
    return this.notificationsService.listForAdmin(Number(limit) || 30);
  }

  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Patch('admin/notifications/read-all')
  markAllReadForAdmin() {
    return this.notificationsService.markAllReadForAdmin();
  }

  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Patch('admin/notifications/:id/read')
  markReadForAdmin(@Param('id') id: string) {
    return this.notificationsService.markReadForAdmin(id);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Get('user/notifications')
  listForUser(
    @Req() req: { user: { sub: string } },
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.listForUser(
      req.user.sub,
      Number(limit) || 30,
    );
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Patch('user/notifications/read-all')
  markAllReadForUser(@Req() req: { user: { sub: string } }) {
    return this.notificationsService.markAllReadForUser(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Patch('user/notifications/:id/read')
  markReadForUser(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.notificationsService.markReadForUser(req.user.sub, id);
  }
}
