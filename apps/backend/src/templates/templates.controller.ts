import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  findAll() {
    return this.templatesService.findAll();
  }

  @Get('by-key/:key')
  findByKey(@Param('key') key: string) {
    return this.templatesService.findByKey(key);
  }

  @Post()
  create(
    @Body()
    body: {
      key?: string;
      numericId?: number;
      title?: string;
      type?: string;
      image?: string;
      previewImage?: string;
      previewDescription?: string;
      prebuiltPages?: number;
      pages?: Prisma.InputJsonValue;
      homeSectionOrder?: Prisma.InputJsonValue;
      sectionVariants?: Prisma.InputJsonValue;
      variables?: Prisma.InputJsonValue;
      order?: number;
      status?: string;
    },
  ) {
    if (
      !body.key?.trim() ||
      body.numericId == null ||
      !body.title?.trim() ||
      !body.type?.trim() ||
      !body.sectionVariants
    ) {
      throw new BadRequestException(
        'key, numericId, title, type, and sectionVariants are required',
      );
    }
    return this.templatesService.create({
      key: body.key,
      numericId: body.numericId,
      title: body.title,
      type: body.type,
      image: body.image,
      previewImage: body.previewImage,
      previewDescription: body.previewDescription,
      prebuiltPages: body.prebuiltPages,
      pages: body.pages,
      homeSectionOrder: body.homeSectionOrder,
      sectionVariants: body.sectionVariants,
      variables: body.variables,
      order: body.order,
      status: body.status,
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
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
    return this.templatesService.update(id, body);
  }

  @Delete()
  remove(@Query('id') id?: string) {
    if (!id) throw new BadRequestException('ID is required');
    return this.templatesService.remove(id);
  }
}
