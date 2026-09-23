import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(data: {
    order?: number;
    name: string;
    slug: string;
    icon?: string;
    description?: string;
    status?: string;
  }) {
    const slug = data.slug.trim();
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Slug already exists');
    }

    return this.prisma.category.create({
      data: {
        order: data.order ?? 1,
        name: data.name.trim(),
        slug,
        icon: data.icon?.trim() || null,
        description: data.description?.trim() || null,
        status: data.status || 'Active',
      },
    });
  }

  async update(
    id: string,
    data: {
      order?: number;
      name?: string;
      slug?: string;
      icon?: string | null;
      description?: string | null;
      status?: string;
    },
  ) {
    const current = await this.prisma.category.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Category not found');

    if (data.slug && data.slug !== current.slug) {
      const taken = await this.prisma.category.findUnique({
        where: { slug: data.slug },
      });
      if (taken) throw new ConflictException('Slug already exists');
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        order: data.order,
        name: data.name?.trim(),
        slug: data.slug?.trim(),
        icon: data.icon === undefined ? undefined : data.icon?.trim() || null,
        description:
          data.description === undefined
            ? undefined
            : data.description?.trim() || null,
        status: data.status,
      },
    });
  }

  async remove(id: string) {
    const current = await this.prisma.category.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Category not found');
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category Deleted' };
  }
}
