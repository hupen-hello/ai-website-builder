import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type PersistedUserState = {
  siteSubscriptions: Prisma.JsonValue;
  purchasedAddons: Prisma.JsonValue;
  purchasedDomains: Prisma.JsonValue;
  domainConnections: Prisma.JsonValue;
};

function asArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Prisma.JsonObject)
    : {};
}

function asStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

@Injectable()
export class UserStateService {
  constructor(private readonly prisma: PrismaService) {}

  async getState(userId: string): Promise<PersistedUserState> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        siteSubscriptions: true,
        purchasedAddons: true,
        purchasedDomains: true,
        domainConnections: true,
      },
    });

    return {
      siteSubscriptions: asRecord(user?.siteSubscriptions),
      purchasedAddons: asArray(user?.purchasedAddons),
      purchasedDomains: asArray(user?.purchasedDomains),
      domainConnections: asArray(user?.domainConnections),
    };
  }

  async saveState(
    userId: string,
    input: Partial<PersistedUserState>,
  ): Promise<PersistedUserState> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.siteSubscriptions !== undefined
          ? {
              siteSubscriptions:
                asRecord(input.siteSubscriptions) as Prisma.InputJsonValue,
            }
          : {}),
        ...(input.purchasedAddons !== undefined
          ? {
              purchasedAddons:
                asArray(input.purchasedAddons) as Prisma.InputJsonValue,
            }
          : {}),
        ...(input.purchasedDomains !== undefined
          ? {
              purchasedDomains:
                asArray(input.purchasedDomains) as Prisma.InputJsonValue,
            }
          : {}),
        ...(input.domainConnections !== undefined
          ? {
              domainConnections:
                asArray(input.domainConnections) as Prisma.InputJsonValue,
            }
          : {}),
      },
      select: {
        siteSubscriptions: true,
        purchasedAddons: true,
        purchasedDomains: true,
        domainConnections: true,
      },
    });

    return {
      siteSubscriptions: asRecord(updated.siteSubscriptions),
      purchasedAddons: asArray(updated.purchasedAddons),
      purchasedDomains: asArray(updated.purchasedDomains),
      domainConnections: asArray(updated.domainConnections),
    };
  }

  async getRazorpayMeta(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        razorpayCustomerId: true,
        razorpayTokenIds: true,
      },
    });

    return {
      customerId: user?.razorpayCustomerId || null,
      tokenIds: asStringArray(user?.razorpayTokenIds),
    };
  }

  async setRazorpayCustomerId(userId: string, customerId: string) {
    const trimmed = customerId.trim();
    if (!trimmed) {
      return this.getRazorpayMeta(userId);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { razorpayCustomerId: trimmed },
    });

    return this.getRazorpayMeta(userId);
  }

  async addRazorpayTokenId(
    userId: string,
    tokenId: string,
    customerId?: string | null,
  ) {
    const trimmed = tokenId.trim();
    if (!trimmed) {
      return this.getRazorpayMeta(userId);
    }

    const current = await this.getRazorpayMeta(userId);
    const tokenIds = current.tokenIds.includes(trimmed)
      ? current.tokenIds
      : [...current.tokenIds, trimmed];

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        razorpayTokenIds: tokenIds,
        ...(customerId?.trim()
          ? { razorpayCustomerId: customerId.trim() }
          : {}),
      },
    });

    return this.getRazorpayMeta(userId);
  }

  async removeRazorpayTokenId(userId: string, tokenId: string) {
    const trimmed = tokenId.trim();
    const current = await this.getRazorpayMeta(userId);
    const tokenIds = current.tokenIds.filter((id) => id !== trimmed);

    await this.prisma.user.update({
      where: { id: userId },
      data: { razorpayTokenIds: tokenIds },
    });

    return this.getRazorpayMeta(userId);
  }
}
