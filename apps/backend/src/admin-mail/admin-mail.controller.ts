import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import {
  AdminMailService,
  type AdminMailUpsertInput,
} from './admin-mail.service';

@Controller('admin/admin-mail')
@UseGuards(JwtAuthGuard, AdminAuthGuard)
export class AdminMailController {
  constructor(private readonly adminMailService: AdminMailService) {}

  @Get()
  getSettings() {
    return this.adminMailService.getSettings();
  }

  @Put()
  upsertSettings(@Body() body: AdminMailUpsertInput) {
    return this.adminMailService.upsertSettings(body);
  }
}
