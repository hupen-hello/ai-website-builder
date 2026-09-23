import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminUsersService } from './admin-users.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminAuthGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.adminUsersService.findAll(search);
  }

  @Get('stats/summary')
  getDashboardSummary() {
    return this.adminUsersService.getDashboardSummary();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status?: string },
  ) {
    return this.adminUsersService.updateStatus(id, body.status);
  }

  @Patch(':id/plans')
  updatePlan(
    @Param('id') id: string,
    @Body()
    body: {
      action?: string;
      siteId?: string;
      cycle?: string;
      days?: number;
    },
  ) {
    return this.adminUsersService.updatePlan(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminUsersService.remove(id);
  }
}
