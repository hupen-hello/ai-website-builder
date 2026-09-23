import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Shape close to categoryContent.json for frontend onboarding + editor */
  async getBundle() {
    const [templates, shared, categoryContents, categoryMeta, layouts] =
      await Promise.all([
        this.prisma.template.findMany({
          where: { status: 'Active' },
          orderBy: [{ order: 'asc' }, { numericId: 'asc' }],
        }),
        this.prisma.sharedContent.findUnique({ where: { key: 'common' } }),
        this.prisma.categoryContent.findMany({
          orderBy: { categoryName: 'asc' },
        }),
        this.prisma.category.findMany({
          where: { status: 'Active' },
          orderBy: { order: 'asc' },
        }),
        this.prisma.layout.findMany({
          where: { status: 'Active' },
          orderBy: [
            { sectionType: 'asc' },
            { order: 'asc' },
            { sectionNumber: 'asc' },
          ],
        }),
      ]);

    const metaByName = new Map(
      categoryMeta.map((c) => [c.name.toLowerCase(), c]),
    );
    const metaBySlug = new Map(categoryMeta.map((c) => [c.slug, c]));

    const categoriesMap: Record<
      string,
      {
        templates: unknown;
        sections: unknown;
        description?: string | null;
        icon?: string | null;
        slug?: string;
        status?: string;
      }
    > = {};

    for (const row of categoryContents) {
      if (row.status && row.status !== 'Active') continue;
      const meta =
        metaBySlug.get(row.categorySlug) ||
        metaByName.get(row.categoryName.toLowerCase());
      if (meta && meta.status !== 'Active') continue;

      categoriesMap[row.categoryName] = {
        templates: row.templateKeys,
        sections: row.sections,
        description: meta?.description ?? null,
        icon: meta?.icon ?? null,
        slug: row.categorySlug,
        status: meta?.status ?? row.status,
      };
    }

    return {
      templates: templates.map((t) => ({
        id: t.key,
        numericId: t.numericId,
        title: t.title,
        type: t.type,
        image: t.image,
        previewimage: t.previewImage,
        preview_description: t.previewDescription,
        prebuilt_pages: t.prebuiltPages,
        pages: t.pages,
        homeSectionOrder: t.homeSectionOrder,
        sectionVariants: t.sectionVariants,
        variables: t.variables,
        status: t.status,
      })),
      common: shared?.sections ?? {},
      categories: categoriesMap,
      layouts: layouts.map((layout) => ({
        id: layout.id,
        key: layout.key,
        name: layout.name,
        sectionType: layout.sectionType,
        sectionNumber: layout.sectionNumber,
        categorySlug: layout.categorySlug,
        scope: layout.scope,
        order: layout.order,
        status: layout.status,
        thumbnailUrl: layout.thumbnailUrl,
        description: layout.description,
      })),
    };
  }

  getShared() {
    return this.prisma.sharedContent.findUnique({ where: { key: 'common' } });
  }

  async upsertShared(sections: Prisma.InputJsonValue) {
    return this.prisma.sharedContent.upsert({
      where: { key: 'common' },
      create: { key: 'common', sections },
      update: { sections },
    });
  }

  findAllCategoryContents() {
    return this.prisma.categoryContent.findMany({
      orderBy: { categoryName: 'asc' },
    });
  }

  async findCategoryContent(slug: string) {
    const row = await this.prisma.categoryContent.findUnique({
      where: { categorySlug: slug },
    });
    if (!row) throw new NotFoundException('Category content not found');
    return row;
  }

  async createCategoryContent(data: {
    categorySlug: string;
    categoryName: string;
    templateKeys: Prisma.InputJsonValue;
    sections: Prisma.InputJsonValue;
    status?: string;
  }) {
    const categorySlug = data.categorySlug.trim().toLowerCase();
    const existing = await this.prisma.categoryContent.findUnique({
      where: { categorySlug },
    });
    if (existing) {
      throw new ConflictException('Category content already exists');
    }

    return this.prisma.categoryContent.create({
      data: {
        categorySlug,
        categoryName: data.categoryName.trim(),
        templateKeys: data.templateKeys,
        sections: data.sections,
        status: data.status || 'Active',
      },
    });
  }

  async updateCategoryContent(
    id: string,
    data: {
      categorySlug?: string;
      categoryName?: string;
      templateKeys?: Prisma.InputJsonValue;
      sections?: Prisma.InputJsonValue;
      status?: string;
    },
  ) {
    const current = await this.prisma.categoryContent.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException('Category content not found');

    if (data.categorySlug && data.categorySlug !== current.categorySlug) {
      const taken = await this.prisma.categoryContent.findUnique({
        where: { categorySlug: data.categorySlug },
      });
      if (taken) throw new ConflictException('Category slug already exists');
    }

    return this.prisma.categoryContent.update({
      where: { id },
      data: {
        categorySlug: data.categorySlug?.trim().toLowerCase(),
        categoryName: data.categoryName?.trim(),
        templateKeys: data.templateKeys,
        sections: data.sections,
        status: data.status,
      },
    });
  }

  async removeCategoryContent(id: string) {
    const current = await this.prisma.categoryContent.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException('Category content not found');
    await this.prisma.categoryContent.delete({ where: { id } });
    return { message: 'Category content deleted' };
  }
}
