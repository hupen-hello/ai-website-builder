import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailDispatchService } from './mail-dispatch.service';
import { NotificationsService } from '../notifications/notifications.service';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const TICK_MS = 60 * 60 * 1000;
const START_DELAY_MS = 20_000;
const DRAFT_REMINDER_TYPE = 'draft_reminder';

@Injectable()
export class DraftReminderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DraftReminderService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private startTimer: ReturnType<typeof setTimeout> | null = null;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailDispatch: MailDispatchService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    this.startTimer = setTimeout(() => {
      void this.tick();
    }, START_DELAY_MS);
    this.timer = setInterval(() => {
      void this.tick();
    }, TICK_MS);
  }

  onModuleDestroy() {
    if (this.startTimer) clearTimeout(this.startTimer);
    if (this.timer) clearInterval(this.timer);
  }

  private appOrigin() {
    return (
      process.env.APP_URL ||
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const cutoff = new Date(Date.now() - THREE_DAYS_MS);
      const idleDrafts = await this.prisma.site.findMany({
        where: {
          published: false,
          status: { not: 'published' },
          updatedAt: { lte: cutoff },
          owner: { status: 'Active' },
        },
        select: {
          id: true,
          title: true,
          templateId: true,
          category: true,
          updatedAt: true,
          ownerId: true,
          owner: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (!idleDrafts.length) return;

      const byOwner = new Map<string, typeof idleDrafts>();
      for (const site of idleDrafts) {
        const list = byOwner.get(site.ownerId) || [];
        list.push(site);
        byOwner.set(site.ownerId, list);
      }

      const origin = this.appOrigin();
      const dashboardUrl = `${origin}/user/dashboard`;

      for (const [ownerId, sites] of byOwner) {
        const owner = sites[0]?.owner;
        if (!owner?.email) continue;

        const last = await this.prisma.notification.findFirst({
          where: {
            audience: 'user',
            userId: ownerId,
            type: DRAFT_REMINDER_TYPE,
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });
        if (last && last.createdAt > cutoff) continue;

        const drafts = sites.slice(0, 5).map((site) => ({
          title: site.title?.trim() || 'Untitled website',
          editorUrl: `${origin}/editor?siteId=${encodeURIComponent(site.id)}&templateId=${encodeURIComponent(site.templateId)}&category=${encodeURIComponent(site.category)}`,
        }));

        const mailed = await this.mailDispatch.sendDraftWebsiteReminder({
          userName: owner.name,
          userEmail: owner.email,
          drafts,
          dashboardUrl,
        });
        if (!mailed.sent) continue;

        const firstTitle = drafts[0]?.title || 'your website';
        await this.notifications.createUserNotification({
          userId: ownerId,
          title: 'Draft website reminder',
          body:
            drafts.length > 1
              ? `You have ${drafts.length} unpublished draft websites waiting.`
              : `"${firstTitle}" is still a draft. Continue editing or publish it.`,
          type: DRAFT_REMINDER_TYPE,
          href: '/user/dashboard',
          meta: { siteIds: sites.map((site) => site.id) },
        });
      }
    } catch (error) {
      this.logger.error(
        'Draft reminder tick failed',
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.running = false;
    }
  }
}
