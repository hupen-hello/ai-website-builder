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
import { LayoutsService } from './layouts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('layouts')
@UseGuards(JwtAuthGuard)
export class LayoutsController {
  constructor(private readonly layoutsService: LayoutsService) {}

  @Get()
  findAll(@Query('sectionType') sectionType?: string) {
    return this.layoutsService.findAll(sectionType);
  }

  @Post()
  create(
    @Body()
    body: {
      key?: string;
      name?: string;
      sectionType?: string;
      sectionNumber?: number;
      categorySlug?: string | null;
      scope?: string;
      order?: number;
      status?: string;
      thumbnailUrl?: string;
      description?: string;
      defaultContent?: Record<string, unknown>;
    },
  ) {
    if (!body.key?.trim() || !body.name?.trim() || !body.sectionType?.trim()) {
      throw new BadRequestException('key, name, and section type are required');
    }
    return this.layoutsService.create({
      key: body.key,
      name: body.name,
      sectionType: body.sectionType,
      sectionNumber: body.sectionNumber,
      categorySlug: body.categorySlug,
      scope: body.scope,
      order: body.order,
      status: body.status,
      thumbnailUrl: body.thumbnailUrl,
      description: body.description,
      defaultContent: body.defaultContent as
        | Prisma.InputJsonValue
        | undefined,
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
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
      defaultContent?: Record<string, unknown> | null;
    },
  ) {
    return this.layoutsService.update(id, {
      ...body,
      defaultContent:
        body.defaultContent === undefined
          ? undefined
          : body.defaultContent === null
            ? null
            : (body.defaultContent as Prisma.InputJsonValue),
    });
  }

  @Delete()
  remove(@Query('id') id?: string) {
    if (!id) throw new BadRequestException('ID is required');
    return this.layoutsService.remove(id);
  }
}
