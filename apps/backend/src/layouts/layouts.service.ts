import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const VARIANT_KEY_RE = /^[A-Za-z][A-Za-z0-9]*-\d+$/;

function isVariantKeyedMap(pack: unknown): pack is Record<string, unknown> {
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) return false;
  return Object.keys(pack).some((k) => VARIANT_KEY_RE.test(k));
}

function cloneJson<T>(value: T): T {
  return structuredClone(value);
}

/** Pick a content bag to use as field template for a new layout variant */
function extractTemplate(
  pack: unknown,
  sectionType: string,
): Record<string, unknown> {
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) return {};
  const obj = pack as Record<string, unknown>;

  if (isVariantKeyedMap(obj)) {
    const preferredKey = `${sectionType}-1`;
    const preferred = obj[preferredKey];
    if (preferred && typeof preferred === 'object' && !Array.isArray(preferred)) {
      return cloneJson(preferred as Record<string, unknown>);
    }
    for (const [key, value] of Object.entries(obj)) {
      if (
        VARIANT_KEY_RE.test(key) &&
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        return cloneJson(value as Record<string, unknown>);
      }
    }
    return {};
  }

  return cloneJson(obj);
}

function writeVariantBag(
  existing: unknown,
  sectionType: string,
  variantKey: string,
  content: Record<string, unknown>,
): Record<string, unknown> {
  const pack =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};

  if (isVariantKeyedMap(pack)) {
    return { ...pack, [variantKey]: content };
  }

  if (Object.keys(pack).length) {
    const baseKey = `${sectionType}-1`;
    return {
      [baseKey]: cloneJson(pack),
      [variantKey]: content,
    };
  }

  return { [variantKey]: content };
}

@Injectable()
export class LayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(sectionType?: string) {
    return this.prisma.layout.findMany({
      where: sectionType ? { sectionType } : undefined,
      orderBy: [
        { sectionType: 'asc' },
        { order: 'asc' },
        { sectionNumber: 'asc' },
      ],
    });
  }

  async create(data: {
    key: string;
    name: string;
    sectionType: string;
    sectionNumber?: number;
    categorySlug?: string | null;
    scope?: string;
    order?: number;
    status?: string;
    thumbnailUrl?: string;
    description?: string;
    defaultContent?: Prisma.InputJsonValue;
  }) {
    const key = data.key.trim();
    const sectionType = data.sectionType.trim();
    const existing = await this.prisma.layout.findUnique({ where: { key } });
    if (existing) {
      throw new ConflictException('Layout key already exists');
    }

    const categorySlug = data.categorySlug?.trim() || null;
    if (categorySlug) {
      const category = await this.prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      if (!category) throw new NotFoundException('Category not found');
      const categoryContent = await this.prisma.categoryContent.findUnique({
        where: { categorySlug },
        select: { id: true },
      });
      if (!categoryContent) {
        throw new NotFoundException('Category content not found');
      }
    }

    const shared = await this.prisma.sharedContent.findUnique({
      where: { key: 'common' },
    });
    const sharedSections =
      shared?.sections && typeof shared.sections === 'object'
        ? (shared.sections as Record<string, unknown>)
        : {};

    const provided =
      data.defaultContent &&
      typeof data.defaultContent === 'object' &&
      !Array.isArray(data.defaultContent)
        ? (data.defaultContent as Record<string, unknown>)
        : null;

    const defaultContent =
      provided && Object.keys(provided).length
        ? provided
        : extractTemplate(sharedSections[sectionType], sectionType);

    const row = await this.prisma.layout.create({
      data: {
        key,
        name: data.name.trim(),
        sectionType,
        sectionNumber: data.sectionNumber ?? 1,
        categorySlug,
        scope: data.scope || 'home',
        order: data.order ?? 1,
        status: data.status || 'Active',
        thumbnailUrl: data.thumbnailUrl?.trim() || null,
        description: data.description?.trim() || null,
        defaultContent: defaultContent as Prisma.InputJsonValue,
      },
    });

    await this.syncContentBags(
      row.key,
      row.sectionType,
      defaultContent,
      row.categorySlug,
    );

    return row;
  }

  async update(
    id: string,
    data: {
      key?: string;
      name?: string;
      sectionType?: string;
      sectionNumber?: number;
      categorySlug?: string | null;
      scope?: string;
      order?: number;
      status?: string;
      thumbnailUrl?: string | null;
      description?: string | null;
      defaultContent?: Prisma.InputJsonValue | null;
    },
  ) {
    const current = await this.prisma.layout.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Layout not found');

    if (data.key && data.key !== current.key) {
      const taken = await this.prisma.layout.findUnique({
        where: { key: data.key },
      });
      if (taken) throw new ConflictException('Layout key already exists');
    }

    const categorySlug =
      data.categorySlug === undefined
        ? undefined
        : data.categorySlug?.trim() || null;
    if (categorySlug) {
      const category = await this.prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      if (!category) throw new NotFoundException('Category not found');
      const categoryContent = await this.prisma.categoryContent.findUnique({
        where: { categorySlug },
        select: { id: true },
      });
      if (!categoryContent) {
        throw new NotFoundException('Category content not found');
      }
    }

    const row = await this.prisma.layout.update({
      where: { id },
      data: {
        key: data.key?.trim(),
        name: data.name?.trim(),
        sectionType: data.sectionType?.trim(),
        sectionNumber: data.sectionNumber,
        categorySlug,
        scope: data.scope,
        order: data.order,
        status: data.status,
        thumbnailUrl:
          data.thumbnailUrl === undefined
            ? undefined
            : data.thumbnailUrl?.trim() || null,
        description:
          data.description === undefined
            ? undefined
            : data.description?.trim() || null,
        defaultContent:
          data.defaultContent === undefined
            ? undefined
            : (data.defaultContent as Prisma.InputJsonValue),
      },
    });

    const content =
      row.defaultContent &&
      typeof row.defaultContent === 'object' &&
      !Array.isArray(row.defaultContent)
        ? (row.defaultContent as Record<string, unknown>)
        : {};

    if (Object.keys(content).length) {
      await this.syncContentBags(
        row.key,
        row.sectionType,
        content,
        row.categorySlug,
      );
    }

    return row;
  }

  /**
   * Push layout fields into SharedContent + every CategoryContent
   * so category-content shows them automatically.
   */
  private async syncContentBags(
    variantKey: string,
    sectionType: string,
    content: Record<string, unknown>,
    categorySlug: string | null,
  ) {
    if (categorySlug) {
      const categoryContent = await this.prisma.categoryContent.findUnique({
        where: { categorySlug },
      });
      if (!categoryContent) {
        throw new NotFoundException('Category content not found');
      }
      const sections =
        categoryContent.sections &&
        typeof categoryContent.sections === 'object'
          ? (categoryContent.sections as Record<string, unknown>)
          : {};
      await this.prisma.categoryContent.update({
        where: { id: categoryContent.id },
        data: {
          sections: {
            ...sections,
            [sectionType]: writeVariantBag(
              sections[sectionType],
              sectionType,
              variantKey,
              content,
            ),
          } as Prisma.InputJsonValue,
        },
      });
      return;
    }

    const shared = await this.prisma.sharedContent.findUnique({
      where: { key: 'common' },
    });
    const sharedSections =
      shared?.sections && typeof shared.sections === 'object'
        ? (shared.sections as Record<string, unknown>)
        : {};

    const nextSharedSections = {
      ...sharedSections,
      [sectionType]: writeVariantBag(
        sharedSections[sectionType],
        sectionType,
        variantKey,
        content,
      ),
    };

    await this.prisma.sharedContent.upsert({
      where: { key: 'common' },
      create: {
        key: 'common',
        sections: nextSharedSections as Prisma.InputJsonValue,
      },
      update: {
        sections: nextSharedSections as Prisma.InputJsonValue,
      },
    });

    const categories = await this.prisma.categoryContent.findMany();
    for (const cat of categories) {
      const sections =
        cat.sections && typeof cat.sections === 'object'
          ? (cat.sections as Record<string, unknown>)
          : {};
      const nextSections = {
        ...sections,
        [sectionType]: writeVariantBag(
          sections[sectionType],
          sectionType,
          variantKey,
          content,
        ),
      };
      await this.prisma.categoryContent.update({
        where: { id: cat.id },
        data: { sections: nextSections as Prisma.InputJsonValue },
      });
    }
  }

  async remove(id: string) {
    const current = await this.prisma.layout.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Layout not found');
    await this.prisma.layout.delete({ where: { id } });
    return { message: 'Layout Deleted' };
  }
}
