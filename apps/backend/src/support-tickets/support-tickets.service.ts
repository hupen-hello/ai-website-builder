import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailDispatchService } from '../mail/mail-dispatch.service';
import { NotificationsService } from '../notifications/notifications.service';

const ALLOWED_STATUSES = new Set([
  'open',
  'in_progress',
  'resolved',
  'closed',
]);

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

/** Consider online if lastSeen within this window */
const ONLINE_WINDOW_MS = 45_000;

type SupportAttachment = {
  name?: string;
  url?: string;
  size?: number;
  mimeType?: string;
};

function normalizeAttachments(input?: SupportAttachment[] | null) {
  if (!Array.isArray(input) || input.length === 0) return null;
  const cleaned = input
    .map((item) => ({
      name: String(item?.name || '').trim().slice(0, 200),
      url: String(item?.url || '').trim().slice(0, 1000),
      size:
        typeof item?.size === 'number' && Number.isFinite(item.size)
          ? Math.max(0, Math.floor(item.size))
          : undefined,
      mimeType: String(item?.mimeType || '').trim().slice(0, 120) || undefined,
    }))
    .filter((item) => item.name && item.url)
    .slice(0, 5);
  return cleaned.length ? cleaned : null;
}

function isRecentlyOnline(lastSeenAt?: Date | null) {
  if (!lastSeenAt) return false;
  return Date.now() - lastSeenAt.getTime() <= ONLINE_WINDOW_MS;
}

@Injectable()
export class SupportTicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailDispatch: MailDispatchService,
    private readonly notifications: NotificationsService,
  ) {}

  async createForUser(
    userId: string,
    input: {
      topic?: string;
      message?: string;
      category?: string;
      service?: string;
    },
  ) {
    const topic = input.topic?.trim();
    const message = input.message?.trim();
    const service = input.service?.trim();
    if (!topic) {
      throw new BadRequestException('Topic is required.');
    }
    if (!service) {
      throw new BadRequestException('Please select which service this request is for.');
    }
    if (!message) {
      throw new BadRequestException('Message is required.');
    }
    if (message.length > 5000) {
      throw new BadRequestException('Message is too long.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const category = (input.category || 'billing').trim() || 'billing';
    const topicWithService = `${topic} · ${service}`;
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId: user.id,
        category,
        topic: topicWithService,
        message,
        status: 'open',
        userName: user.name,
        userEmail: user.email,
      },
    });

    void this.mailDispatch
      .sendBillingSupportAlert({
        topic: topicWithService,
        message,
        category,
        service,
        userName: user.name,
        userEmail: user.email,
      })
      .catch(() => undefined);

    void this.notifications
      .createAdminNotification({
        title: 'New billing support',
        body: `${user.name || user.email} · ${topicWithService}\n\n${message}`,
        type: 'billing_support',
        href: '/notifications',
        meta: {
          ticketId: ticket.id,
          userId: user.id,
          topic: topicWithService,
          message,
          service: service || null,
        },
      })
      .catch(() => undefined);

    void this.notifications
      .createUserNotification({
        userId: user.id,
        title: 'Billing support received',
        body: `Topic: ${topicWithService}\n\n${message}`,
        type: 'billing_support',
        href: '/user/notifications',
        meta: {
          ticketId: ticket.id,
          topic: topicWithService,
          message,
          service: service || null,
        },
      })
      .catch(() => undefined);

    return ticket;
  }

  async listForAdmin(input?: {
    search?: string;
    status?: string;
    category?: string;
  }) {
    const search = input?.search?.trim();
    const status = input?.status?.trim();
    const category = input?.category?.trim();

    const tickets = await this.prisma.supportTicket.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
        ...(search
          ? {
              OR: [
                { topic: { contains: search, mode: 'insensitive' } },
                { message: { contains: search, mode: 'insensitive' } },
                { userName: { contains: search, mode: 'insensitive' } },
                { userEmail: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            status: true,
            avatarUrl: true,
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const [open, inProgress, resolved, closed, total] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: 'open' } }),
      this.prisma.supportTicket.count({ where: { status: 'in_progress' } }),
      this.prisma.supportTicket.count({ where: { status: 'resolved' } }),
      this.prisma.supportTicket.count({ where: { status: 'closed' } }),
      this.prisma.supportTicket.count(),
    ]);

    return {
      tickets,
      stats: {
        total,
        open,
        inProgress,
        resolved,
        closed,
      },
    };
  }

  async touchUserPresence(userId: string) {
    const now = new Date();
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: now },
    });
    return { online: true, lastSeenAt: now.toISOString() };
  }

  async touchAdminPresence(adminId: string) {
    const now = new Date();
    await this.prisma.admin.update({
      where: { id: adminId },
      data: { lastSeenAt: now },
    });
    return { online: true, lastSeenAt: now.toISOString() };
  }

  private async isSupportOnline() {
    const recent = new Date(Date.now() - ONLINE_WINDOW_MS);
    const count = await this.prisma.admin.count({
      where: { lastSeenAt: { gte: recent } },
    });
    return count > 0;
  }

  private async isUserOnline(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastSeenAt: true },
    });
    return isRecentlyOnline(user?.lastSeenAt);
  }

  private async markRepliesRead(ticketId: string, authorRole: 'admin' | 'user') {
    await this.prisma.supportTicketReply.updateMany({
      where: {
        ticketId,
        authorRole,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  async findOneForAdmin(id: string, adminId?: string) {
    if (adminId) {
      await this.touchAdminPresence(adminId).catch(() => undefined);
    }

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            status: true,
            createdAt: true,
            lastSeenAt: true,
            avatarUrl: true,
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found.');
    }

    await this.markRepliesRead(ticket.id, 'user');

    const refreshed = await this.prisma.supportTicket.findUnique({
      where: { id: ticket.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            status: true,
            createdAt: true,
            lastSeenAt: true,
            avatarUrl: true,
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      ...refreshed!,
      presence: {
        userOnline: isRecentlyOnline(refreshed?.user?.lastSeenAt),
        supportOnline: true,
      },
    };
  }

  async findOneForUser(userId: string, id: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, userId },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found.');
    }

    await this.touchUserPresence(userId);
    await this.markRepliesRead(ticket.id, 'admin');

    const refreshed = await this.prisma.supportTicket.findFirst({
      where: { id: ticket.id, userId },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      ...refreshed!,
      presence: {
        supportOnline: await this.isSupportOnline(),
        userOnline: true,
      },
    };
  }

  async getPresenceForUser(userId: string) {
    await this.touchUserPresence(userId);
    return {
      supportOnline: await this.isSupportOnline(),
      userOnline: true,
    };
  }

  async getPresenceForAdmin(adminId: string, userId?: string) {
    await this.touchAdminPresence(adminId);
    return {
      supportOnline: true,
      userOnline: userId ? await this.isUserOnline(userId) : false,
    };
  }

  async replyForAdmin(
    id: string,
    input: {
      message?: string;
      status?: string;
      attachments?: SupportAttachment[];
    },
  ) {
    const message = input.message?.trim() || '';
    const attachments = normalizeAttachments(input.attachments);
    if (!message && !attachments) {
      throw new BadRequestException('Reply message or attachment is required.');
    }
    if (message.length > 5000) {
      throw new BadRequestException('Reply is too long.');
    }

    const nextStatus = input.status?.trim();
    if (nextStatus && !ALLOWED_STATUSES.has(nextStatus)) {
      throw new BadRequestException(
        'Status must be open, in_progress, resolved, or closed.',
      );
    }

    const existing = await this.prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, userId: true, topic: true, message: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException('Support ticket not found.');
    }

    const replyBody = message || 'Sent an attachment';
    const [, ticket] = await this.prisma.$transaction([
      this.prisma.supportTicketReply.create({
        data: {
          ticketId: existing.id,
          authorRole: 'admin',
          body: replyBody,
          attachments: attachments
            ? (attachments as Prisma.InputJsonValue)
            : undefined,
        },
      }),
      this.prisma.supportTicket.update({
        where: { id: existing.id },
        data: {
          status: nextStatus || (existing.status === 'open' ? 'in_progress' : existing.status),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              status: true,
            },
          },
          replies: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    void this.notifications
      .createUserNotification({
        userId: ticket.userId,
        title: 'Support reply',
        body: `Admin replied to "${ticket.topic}":\n\n${replyBody}`,
        type: 'support_reply',
        href: '/user/notifications',
        meta: {
          ticketId: ticket.id,
          topic: ticket.topic,
          message: ticket.message,
          reply: replyBody,
          status: ticket.status,
          hasAttachments: Boolean(attachments?.length),
        },
      })
      .catch(() => undefined);

    return ticket;
  }

  async replyForUser(
    userId: string,
    id: string,
    input: { message?: string; attachments?: SupportAttachment[] },
  ) {
    const message = input.message?.trim() || '';
    const attachments = normalizeAttachments(input.attachments);
    if (!message && !attachments) {
      throw new BadRequestException('Reply message or attachment is required.');
    }
    if (message.length > 5000) {
      throw new BadRequestException('Reply is too long.');
    }

    const existing = await this.prisma.supportTicket.findFirst({
      where: { id, userId },
      select: {
        id: true,
        userId: true,
        topic: true,
        message: true,
        status: true,
        userName: true,
        userEmail: true,
      },
    });
    if (!existing) {
      throw new NotFoundException('Support ticket not found.');
    }
    if (existing.status === 'closed') {
      throw new BadRequestException(
        'This ticket is closed. Please open a new billing support request.',
      );
    }

    const nextStatus =
      existing.status === 'resolved' ? 'in_progress' : existing.status;
    const replyBody = message || 'Sent an attachment';

    const [, ticket] = await this.prisma.$transaction([
      this.prisma.supportTicketReply.create({
        data: {
          ticketId: existing.id,
          authorRole: 'user',
          body: replyBody,
          attachments: attachments
            ? (attachments as Prisma.InputJsonValue)
            : undefined,
        },
      }),
      this.prisma.supportTicket.update({
        where: { id: existing.id },
        data: { status: nextStatus },
        include: {
          replies: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    void this.notifications
      .createAdminNotification({
        title: 'User replied to support',
        body: `${existing.userName || existing.userEmail || 'User'} · ${existing.topic}\n\n${replyBody}`,
        type: 'user_reply',
        href: '/notifications',
        meta: {
          ticketId: ticket.id,
          userId: existing.userId,
          topic: existing.topic,
          message: existing.message,
          reply: replyBody,
          status: ticket.status,
          hasAttachments: Boolean(attachments?.length),
        },
      })
      .catch(() => undefined);

    return ticket;
  }

  async updateStatusForAdmin(id: string, status?: string) {
    const next = status?.trim();
    if (!next || !ALLOWED_STATUSES.has(next)) {
      throw new BadRequestException(
        'Status must be open, in_progress, resolved, or closed.',
      );
    }

    try {
      const ticket = await this.prisma.supportTicket.update({
        where: { id },
        data: { status: next },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              status: true,
            },
          },
          replies: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      void this.notifications
        .createUserNotification({
          userId: ticket.userId,
          title: 'Billing support update',
          body: `Your request "${ticket.topic}" is now ${STATUS_LABELS[next] || next}.\n\nYour message:\n${ticket.message}`,
          type: 'ticket_status',
          href: '/user/notifications',
          meta: {
            ticketId: ticket.id,
            status: next,
            topic: ticket.topic,
            message: ticket.message,
          },
        })
        .catch(() => undefined);

      return ticket;
    } catch {
      throw new NotFoundException('Support ticket not found.');
    }
  }
}
