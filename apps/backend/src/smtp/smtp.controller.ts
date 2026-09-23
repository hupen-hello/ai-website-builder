import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { SmtpService, type SmtpUpsertInput } from './smtp.service';

@Controller('admin/smtp')
@UseGuards(JwtAuthGuard, AdminAuthGuard)
export class SmtpController {
  constructor(private readonly smtpService: SmtpService) {}

  @Get()
  getSettings() {
    return this.smtpService.getSettings();
  }

  @Put()
  upsertSettings(@Body() body: SmtpUpsertInput) {
    return this.smtpService.upsertSettings(body);
  }

  @Post('check')
  checkConnection(@Body() body: SmtpUpsertInput) {
    return this.smtpService.checkConnection(body);
  }
}
