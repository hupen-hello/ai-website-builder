import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { SupportTicketsService } from './support-tickets.service';

@Controller()
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Post('support-tickets')
  create(
    @Req() req: { user: { sub: string } },
    @Body()
    body: {
      topic?: string;
      message?: string;
      category?: string;
    },
  ) {
    return this.supportTicketsService.createForUser(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Post('user/presence')
  touchUserPresence(@Req() req: { user: { sub: string } }) {
    return this.supportTicketsService.getPresenceForUser(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Post('admin/presence')
  touchAdminPresence(
    @Req() req: { user: { sub: string } },
    @Body() body: { userId?: string },
  ) {
    return this.supportTicketsService.getPresenceForAdmin(
      req.user.sub,
      body?.userId,
    );
  }

  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Get('admin/support-tickets')
  listForAdmin(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    return this.supportTicketsService.listForAdmin({
      search,
      status,
      category,
    });
  }

  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Get('admin/support-tickets/:id')
  findOneForAdmin(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.supportTicketsService.findOneForAdmin(id, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Get('user/support-tickets/:id')
  findOneForUser(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.supportTicketsService.findOneForUser(req.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Post('user/support-tickets/:id/replies')
  replyForUser(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body()
    body: {
      message?: string;
      attachments?: Array<{
        name?: string;
        url?: string;
        size?: number;
        mimeType?: string;
      }>;
    },
  ) {
    return this.supportTicketsService.replyForUser(req.user.sub, id, body);
  }

  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Post('admin/support-tickets/:id/replies')
  replyForAdmin(
    @Param('id') id: string,
    @Body()
    body: {
      message?: string;
      status?: string;
      attachments?: Array<{
        name?: string;
        url?: string;
        size?: number;
        mimeType?: string;
      }>;
    },
  ) {
    return this.supportTicketsService.replyForAdmin(id, body);
  }

  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Patch('admin/support-tickets/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status?: string },
  ) {
    return this.supportTicketsService.updateStatusForAdmin(id, body.status);
  }
}
