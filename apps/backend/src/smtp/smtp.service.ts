import { BadRequestException, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildSmtpTransportOptions,
  describeSmtpEncryption,
  normalizeSmtpSecure,
} from './smtp-transport';

export type SmtpUpsertInput = {
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  password?: string;
  fromEmail?: string;
  fromName?: string | null;
  enabled?: boolean;
};

@Injectable()
export class SmtpService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const setting = await this.prisma.smtpSetting.findFirst({
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
      settings: this.toPublic(setting),
    };
  }

  async upsertSettings(input: SmtpUpsertInput) {
    const host = input.host?.trim() || '';
    const username = input.username?.trim() || '';
    const fromEmail = input.fromEmail?.trim() || '';
    const fromName = input.fromName?.trim() || null;
    const passwordInput =
      typeof input.password === 'string' ? input.password : '';
    const port = Number(input.port);
    const enabled = input.enabled !== false;

    if (!host) throw new BadRequestException('SMTP host is required.');
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      throw new BadRequestException('SMTP port must be between 1 and 65535.');
    }
    if (!username) throw new BadRequestException('SMTP username is required.');
    if (!fromEmail || !this.isValidEmail(fromEmail)) {
      throw new BadRequestException('A valid from email is required.');
    }

    const secure = normalizeSmtpSecure(Math.floor(port), input.secure);
    const existing = await this.prisma.smtpSetting.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!existing && !passwordInput.trim()) {
      throw new BadRequestException('SMTP password is required.');
    }

    const data = {
      host,
      port: Math.floor(port),
      secure,
      username,
      fromEmail,
      fromName,
      enabled,
      ...(passwordInput.trim()
        ? { password: passwordInput.trim() }
        : existing
          ? {}
          : { password: '' }),
    };

    const saved = existing
      ? await this.prisma.smtpSetting.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.smtpSetting.create({
          data: {
            ...data,
            password: passwordInput.trim(),
          },
        });

    return {
      configured: true,
      message: existing ? 'SMTP settings updated.' : 'SMTP settings saved.',
      settings: this.toPublic(saved),
    };
  }

  async checkConnection(input?: SmtpUpsertInput) {
    const existing = await this.prisma.smtpSetting.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    const host = input?.host?.trim() || existing?.host || '';
    const username = input?.username?.trim() || existing?.username || '';
    const fromEmail = input?.fromEmail?.trim() || existing?.fromEmail || '';
    const fromName =
      input?.fromName !== undefined
        ? input.fromName?.trim() || null
        : existing?.fromName || null;
    const portRaw =
      input?.port !== undefined && input?.port !== null
        ? Number(input.port)
        : existing?.port;
    const passwordInput =
      typeof input?.password === 'string' ? input.password.trim() : '';
    const password = passwordInput || existing?.password || '';

    if (!host) throw new BadRequestException('SMTP host is required.');
    if (!Number.isFinite(portRaw) || !portRaw || portRaw < 1 || portRaw > 65535) {
      throw new BadRequestException('SMTP port must be between 1 and 65535.');
    }
    if (!username) throw new BadRequestException('SMTP username is required.');
    if (!password) {
      throw new BadRequestException(
        'SMTP password is required to check the connection.',
      );
    }
    if (!fromEmail || !this.isValidEmail(fromEmail)) {
      throw new BadRequestException('A valid from email is required.');
    }

    const port = Math.floor(portRaw);
    const secure = normalizeSmtpSecure(
      port,
      input?.secure !== undefined ? input.secure : existing?.secure,
    );
    const encryption = describeSmtpEncryption(port, secure);
    const transporter = nodemailer.createTransport(
      buildSmtpTransportOptions({
        host,
        port,
        secure,
        username,
        password,
      }),
    );

    try {
      await transporter.verify();
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'SMTP connection failed.';
      throw new BadRequestException(`SMTP check failed: ${detail}`);
    }

    const adminInbox = await this.prisma.adminMailSetting.findFirst({
      where: { enabled: true },
      orderBy: { createdAt: 'asc' },
    });
    const testTo = adminInbox?.email || fromEmail;
    const displayFrom = fromName?.trim() || 'CSS Founder';

    try {
      await transporter.sendMail({
        from: `"${displayFrom}" <${fromEmail}>`,
        to: testTo,
        subject: 'CSS Founder SMTP check',
        text: [
          'SMTP connection check succeeded.',
          '',
          `Host: ${host}`,
          `Port: ${port}`,
          `Encryption: ${encryption.mode} (encrypted: yes)`,
          encryption.detail,
          `From: ${fromEmail}`,
          `To: ${testTo}`,
          `Time: ${new Date().toISOString()}`,
        ].join('\n'),
        html: `<p>SMTP connection check succeeded.</p><ul><li><strong>Host:</strong> ${host}</li><li><strong>Port:</strong> ${port}</li><li><strong>Encryption:</strong> ${encryption.mode} (encrypted)</li><li><strong>From:</strong> ${fromEmail}</li><li><strong>To:</strong> ${testTo}</li></ul><p>${encryption.detail}</p>`,
      });
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'Unable to send test email.';
      throw new BadRequestException(
        `SMTP verified, but test email failed: ${detail}`,
      );
    }

    return {
      ok: true,
      message: `SMTP working with ${encryption.mode}. Test email sent to ${testTo}.`,
      testedWith: {
        host,
        port,
        secure,
        encryption: encryption.mode,
        encrypted: true,
        username,
        fromEmail,
        to: testTo,
      },
    };
  }

  private toPublic(setting: {
    id: string;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    fromEmail: string;
    fromName: string | null;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: setting.id,
      host: setting.host,
      port: setting.port,
      secure: setting.secure,
      username: setting.username,
      fromEmail: setting.fromEmail,
      fromName: setting.fromName,
      enabled: setting.enabled,
      hasPassword: Boolean(setting.password),
      passwordSet: Boolean(setting.password),
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };
  }

  private isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
