import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CreateAiDesignsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertMine(
    ownerId: string,
    body: {
      designKey?: string;
      title?: string;
      brandName?: string;
      category?: string;
      pageType?: string;
      pageCount?: number;
      pageLabels?: unknown;
      status?: string;
      payload?: unknown;
      site?: unknown;
      chat?: unknown;
    },
  ) {
    const designKey = body.designKey?.trim();
    if (!designKey || !/^ca_/i.test(designKey)) {
      throw new BadRequestException(
        'Valid create-ai designKey (ca_…) is required',
      );
    }

    const existing = await this.prisma.createAiDesign.findUnique({
      where: { designKey },
      select: { id: true, ownerId: true },
    });
    if (existing && existing.ownerId !== ownerId) {
      throw new ForbiddenException('This Create-AI design belongs to another user');
    }

    const pageCount =
      typeof body.pageCount === 'number' && Number.isFinite(body.pageCount)
        ? Math.min(50, Math.max(1, Math.floor(body.pageCount)))
        : 1;
    const statusRaw = body.status?.trim().toLowerCase();
    const status =
      statusRaw === 'exported' || statusRaw === 'published'
        ? statusRaw
        : 'draft';
    const labels = Array.isArray(body.pageLabels)
      ? body.pageLabels
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 50)
      : [];

    const data: Prisma.CreateAiDesignUpdateInput = {
      title: body.title?.trim() || body.brandName?.trim() || null,
      brandName: body.brandName?.trim() || null,
      category: body.category?.trim() || null,
      pageType: body.pageType?.trim() || null,
      pageCount,
      pageLabels: labels as Prisma.InputJsonValue,
      status,
      lastSyncedAt: new Date(),
    };

    if (body.payload !== undefined && body.payload !== null) {
      data.payload = body.payload as Prisma.InputJsonValue;
    }
    if (body.site !== undefined && body.site !== null) {
      data.site = body.site as Prisma.InputJsonValue;
    }
    if (body.chat !== undefined && body.chat !== null) {
      data.chat = body.chat as Prisma.InputJsonValue;
    }

    return this.prisma.createAiDesign.upsert({
      where: { designKey },
      create: {
        designKey,
        ownerId,
        title: (data.title as string | null) ?? null,
        brandName: (data.brandName as string | null) ?? null,
        category: (data.category as string | null) ?? null,
        pageType: (data.pageType as string | null) ?? null,
        pageCount,
        pageLabels: labels as Prisma.InputJsonValue,
        payload:
          body.payload !== undefined && body.payload !== null
            ? (body.payload as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        site:
          body.site !== undefined && body.site !== null
            ? (body.site as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        chat:
          body.chat !== undefined && body.chat !== null
            ? (body.chat as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        status,
        lastSyncedAt: new Date(),
      },
      update: data,
      select: {
        id: true,
        designKey: true,
        title: true,
        brandName: true,
        category: true,
        pageType: true,
        pageCount: true,
        status: true,
        lastSyncedAt: true,
        updatedAt: true,
      },
    });
  }

  async listMine(ownerId: string) {
    return this.prisma.createAiDesign.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        designKey: true,
        title: true,
        brandName: true,
        category: true,
        pageType: true,
        pageCount: true,
        pageLabels: true,
        status: true,
        lastSyncedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getMine(ownerId: string, designKeyRaw: string) {
    const designKey = designKeyRaw?.trim();
    if (!designKey || !/^ca_/i.test(designKey)) {
      throw new BadRequestException(
        'Valid create-ai designKey (ca_…) is required',
      );
    }
    const row = await this.prisma.createAiDesign.findFirst({
      where: { designKey, ownerId },
      select: {
        id: true,
        designKey: true,
        title: true,
        brandName: true,
        category: true,
        pageType: true,
        pageCount: true,
        pageLabels: true,
        payload: true,
        site: true,
        chat: true,
        status: true,
        lastSyncedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!row) {
      throw new NotFoundException('Create-AI design not found');
    }
    return row;
  }

  async removeMine(ownerId: string, designKeyRaw: string) {
    const designKey = designKeyRaw?.trim();
    if (!designKey) {
      throw new BadRequestException('designKey is required');
    }
    const existing = await this.prisma.createAiDesign.findFirst({
      where: { designKey, ownerId },
      select: { id: true },
    });
    if (!existing) {
      throw new ForbiddenException('Create-AI design not found');
    }
    await this.prisma.createAiDesign.delete({ where: { id: existing.id } });
    return { ok: true, designKey };
  }
}
