import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.template.findMany({
      orderBy: [{ order: 'asc' }, { numericId: 'asc' }],
    });
  }

  async findByKey(key: string) {
    const row = await this.prisma.template.findUnique({ where: { key } });
    if (!row) throw new NotFoundException('Template not found');
    return row;
  }

  async create(data: {
    key: string;
    numericId: number;
    title: string;
    type: string;
    image?: string;
    previewImage?: string;
    previewDescription?: string;
    prebuiltPages?: number;
    pages?: Prisma.InputJsonValue;
    homeSectionOrder?: Prisma.InputJsonValue;
    sectionVariants: Prisma.InputJsonValue;
    variables?: Prisma.InputJsonValue;
    order?: number;
    status?: string;
  }) {
    const key = data.key.trim();
    const existing = await this.prisma.template.findUnique({ where: { key } });
    if (existing) throw new ConflictException('Template key already exists');

    const takenId = await this.prisma.template.findUnique({
      where: { numericId: data.numericId },
    });
    if (takenId) throw new ConflictException('numericId already exists');

    return this.prisma.template.create({
      data: {
        key,
        numericId: data.numericId,
        title: data.title.trim(),
        type: data.type.trim(),
        image: data.image?.trim() || null,
        previewImage: data.previewImage?.trim() || null,
        previewDescription: data.previewDescription?.trim() || null,
        prebuiltPages: data.prebuiltPages ?? 0,
        pages: data.pages ?? undefined,
        homeSectionOrder: data.homeSectionOrder ?? undefined,
        sectionVariants: data.sectionVariants,
        variables: data.variables ?? undefined,
        order: data.order ?? data.numericId,
        status: data.status || 'Active',
      },
    });
  }

  async update(
    id: string,
    data: {
      key?: string;
      numericId?: number;
      title?: string;
      type?: string;
      image?: string | null;
      previewImage?: string | null;
      previewDescription?: string | null;
      prebuiltPages?: number;
      pages?: Prisma.InputJsonValue | null;
      homeSectionOrder?: Prisma.InputJsonValue | null;
      sectionVariants?: Prisma.InputJsonValue;
      variables?: Prisma.InputJsonValue | null;
      order?: number;
      status?: string;
    },
  ) {
    const current = await this.prisma.template.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Template not found');

    if (data.key && data.key !== current.key) {
      const taken = await this.prisma.template.findUnique({
        where: { key: data.key },
      });
      if (taken) throw new ConflictException('Template key already exists');
    }

    if (data.numericId && data.numericId !== current.numericId) {
      const taken = await this.prisma.template.findUnique({
        where: { numericId: data.numericId },
      });
      if (taken) throw new ConflictException('numericId already exists');
    }

    return this.prisma.template.update({
      where: { id },
      data: {
        key: data.key?.trim(),
        numericId: data.numericId,
        title: data.title?.trim(),
        type: data.type?.trim(),
        image:
          data.image === undefined ? undefined : data.image?.trim() || null,
        previewImage:
          data.previewImage === undefined
            ? undefined
            : data.previewImage?.trim() || null,
        previewDescription:
          data.previewDescription === undefined
            ? undefined
            : data.previewDescription?.trim() || null,
        prebuiltPages: data.prebuiltPages,
        pages:
          data.pages === undefined
            ? undefined
            : data.pages === null
              ? Prisma.DbNull
              : data.pages,
        homeSectionOrder:
          data.homeSectionOrder === undefined
            ? undefined
            : data.homeSectionOrder === null
              ? Prisma.DbNull
              : data.homeSectionOrder,
        sectionVariants: data.sectionVariants,
        variables:
          data.variables === undefined
            ? undefined
            : data.variables === null
              ? Prisma.DbNull
              : data.variables,
        order: data.order,
        status: data.status,
      },
    });
  }

  async remove(id: string) {
    const current = await this.prisma.template.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Template not found');
    await this.prisma.template.delete({ where: { id } });
    return { message: 'Template Deleted' };
  }
}
