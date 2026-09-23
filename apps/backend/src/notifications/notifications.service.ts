import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private getTicketIdFromMeta(meta?: Prisma.InputJsonValue | null) {
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
    const ticketId = (meta as Record<string, unknown>).ticketId;
    return typeof ticketId === 'string' && ticketId.trim() ? ticketId : null;
  }

  private dedupeByTicket<T extends { id: string; meta?: unknown; createdAt: Date }>(
    items: T[],
  ) {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const item of items) {
      const meta =
        item.meta && typeof item.meta === 'object' && !Array.isArray(item.meta)
          ? (item.meta as Record<string, unknown>)
          : null;
      const ticketId =
        typeof meta?.ticketId === 'string' ? meta.ticketId : null;
      if (ticketId) {
        if (seen.has(ticketId)) continue;
        seen.add(ticketId);
      }
      result.push(item);
    }
    return result;
  }

  async createAdminNotification(input: {
    title: string;
    body: string;
    type?: string;
    href?: string | null;
    meta?: Prisma.InputJsonValue;
  }) {
    const type = input.type?.trim() || 'system';
    const ticketId = this.getTicketIdFromMeta(input.meta);

    if (
      ticketId &&
      (type === 'billing_support' ||
        type === 'user_reply' ||
        type === 'support_reply')
    ) {
      const recent = await this.prisma.notification.findMany({
        where: {
          audience: 'admin',
          type: { in: ['billing_support', 'user_reply', 'support_reply'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      const existing = recent.find((row) => {
        const meta =
          row.meta && typeof row.meta === 'object' && !Array.isArray(row.meta)
            ? (row.meta as Record<string, unknown>)
            : null;
        return meta?.ticketId === ticketId;
      });
      if (existing) {
        return this.prisma.notification.update({
          where: { id: existing.id },
          data: {
            title: input.title.trim(),
            body: input.body.trim(),
            type,
            href: input.href || existing.href,
            meta: input.meta,
            readAt: null,
            createdAt: new Date(),
          },
        });
      }
    }

    return this.prisma.notification.create({
      data: {
        audience: 'admin',
        title: input.title.trim(),
        body: input.body.trim(),
        type,
        href: input.href || null,
        meta: input.meta,
      },
    });
  }

  async createUserNotification(input: {
    userId: string;
    title: string;
    body: string;
    type?: string;
    href?: string | null;
    meta?: Prisma.InputJsonValue;
  }) {
    const type = input.type?.trim() || 'system';
    const ticketId = this.getTicketIdFromMeta(input.meta);

    if (
      ticketId &&
      (type === 'billing_support' ||
        type === 'support_reply' ||
        type === 'ticket_status')
    ) {
      const recent = await this.prisma.notification.findMany({
        where: {
          audience: 'user',
          userId: input.userId,
          type: {
            in: ['billing_support', 'support_reply', 'ticket_status'],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      const existing = recent.find((row) => {
        const meta =
          row.meta && typeof row.meta === 'object' && !Array.isArray(row.meta)
            ? (row.meta as Record<string, unknown>)
            : null;
        return meta?.ticketId === ticketId;
      });
      if (existing) {
        return this.prisma.notification.update({
          where: { id: existing.id },
          data: {
            title: input.title.trim(),
            body: input.body.trim(),
            type,
            href: input.href || existing.href,
            meta: input.meta,
            readAt: null,
            createdAt: new Date(),
          },
        });
      }
    }

    return this.prisma.notification.create({
      data: {
        audience: 'user',
        userId: input.userId,
        title: input.title.trim(),
        body: input.body.trim(),
        type,
        href: input.href || null,
        meta: input.meta,
      },
    });
  }

  async listForAdmin(limit = 30) {
    const take = Math.min(Math.max(limit, 1), 100);
    const rawItems = await this.prisma.notification.findMany({
      where: { audience: 'admin' },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const deduped = this.dedupeByTicket(rawItems);
    return {
      items: deduped.slice(0, take),
      unreadCount: deduped.filter((item) => !item.readAt).length,
    };
  }

  async listForUser(userId: string, limit = 30) {
    const take = Math.min(Math.max(limit, 1), 100);
    const rawItems = await this.prisma.notification.findMany({
      where: { audience: 'user', userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const deduped = this.dedupeByTicket(rawItems);
    const items = deduped.slice(0, take);
    const unreadCount = deduped.filter((item) => !item.readAt).length;

    const ticketIds = items
      .map((item) => {
        const meta =
          item.meta && typeof item.meta === 'object' && !Array.isArray(item.meta)
            ? (item.meta as Record<string, unknown>)
            : null;
        return typeof meta?.ticketId === 'string' ? meta.ticketId : null;
      })
      .filter((id): id is string => Boolean(id));

    const tickets =
      ticketIds.length > 0
        ? await this.prisma.supportTicket.findMany({
            where: { userId, id: { in: ticketIds } },
            select: { id: true, topic: true, message: true, status: true },
          })
        : [];
    const ticketById = new Map(tickets.map((ticket) => [ticket.id, ticket]));

    const enriched = items.map((item) => {
      const meta =
        item.meta && typeof item.meta === 'object' && !Array.isArray(item.meta)
          ? { ...(item.meta as Record<string, unknown>) }
          : {};
      const ticketId =
        typeof meta.ticketId === 'string' ? meta.ticketId : null;
      const ticket = ticketId ? ticketById.get(ticketId) : null;
      if (!ticket) return item;

      const topic =
        typeof meta.topic === 'string' && meta.topic.trim()
          ? meta.topic
          : ticket.topic;
      const message =
        typeof meta.message === 'string' && meta.message.trim()
          ? meta.message
          : ticket.message;

      return {
        ...item,
        body:
          item.type === 'billing_support'
            ? `Topic: ${topic}\n\n${message}`
            : item.body.includes(message)
              ? item.body
              : `${item.body}\n\nYour message:\n${message}`,
        meta: {
          ...meta,
          topic,
          message,
          status: ticket.status,
        },
      };
    });

    return { items: enriched, unreadCount };
  }

  async markReadForAdmin(id: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, audience: 'admin' },
    });
    if (!existing) throw new NotFoundException('Notification not found.');
    if (existing.readAt) return existing;
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllReadForAdmin() {
    const result = await this.prisma.notification.updateMany({
      where: { audience: 'admin', readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  async markReadForUser(userId: string, id: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, audience: 'user', userId },
    });
    if (!existing) throw new NotFoundException('Notification not found.');
    if (existing.readAt) return existing;
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllReadForUser(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { audience: 'user', userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}
