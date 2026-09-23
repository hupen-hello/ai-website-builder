import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AdminMailUpsertInput = {
  email?: string;
  name?: string | null;
  enabled?: boolean;
};

@Injectable()
export class AdminMailService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const setting = await this.prisma.adminMailSetting.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (!setting) {
      return {
        configured: false,
        settings: null,
      };
    }
    return {
      configured: true,
      settings: setting,
    };
  }

  async upsertSettings(input: AdminMailUpsertInput) {
    const email = input.email?.trim().toLowerCase() || '';
    const name = input.name?.trim() || null;
    const enabled = input.enabled !== false;

    if (!email || !this.isValidEmail(email)) {
      throw new BadRequestException('A valid admin email is required.');
    }

    const existing = await this.prisma.adminMailSetting.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    const saved = existing
      ? await this.prisma.adminMailSetting.update({
          where: { id: existing.id },
          data: { email, name, enabled },
        })
      : await this.prisma.adminMailSetting.create({
          data: { email, name, enabled },
        });

    return {
      configured: true,
      message: existing
        ? 'Admin mail updated.'
        : 'Admin mail saved.',
      settings: saved,
    };
  }

  async getActiveInbox() {
    const setting = await this.prisma.adminMailSetting.findFirst({
      where: { enabled: true },
      orderBy: { createdAt: 'asc' },
    });
    return setting;
  }

  private isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
