import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ContentsService } from './contents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('contents')
@UseGuards(JwtAuthGuard)
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  /** Full bundle shaped like categoryContent.json (public for frontend preview) */
  @Public()
  @Get('bundle')
  getBundle() {
    return this.contentsService.getBundle();
  }

  @Get('shared')
  getShared() {
    return this.contentsService.getShared();
  }

  @Put('shared')
  upsertShared(@Body() body: { sections?: Prisma.InputJsonValue }) {
    if (!body.sections) {
      throw new BadRequestException('sections is required');
    }
    return this.contentsService.upsertShared(body.sections);
  }

  @Get('categories')
  findAllCategoryContents() {
    return this.contentsService.findAllCategoryContents();
  }

  @Get('categories/:slug')
  findCategoryContent(@Param('slug') slug: string) {
    return this.contentsService.findCategoryContent(slug);
  }

  @Post('categories')
  createCategoryContent(
    @Body()
    body: {
      categorySlug?: string;
      categoryName?: string;
      templateKeys?: Prisma.InputJsonValue;
      sections?: Prisma.InputJsonValue;
      status?: string;
    },
  ) {
    if (
      !body.categorySlug?.trim() ||
      !body.categoryName?.trim() ||
      !body.templateKeys ||
      !body.sections
    ) {
      throw new BadRequestException(
        'categorySlug, categoryName, templateKeys, and sections are required',
      );
    }
    return this.contentsService.createCategoryContent({
      categorySlug: body.categorySlug,
      categoryName: body.categoryName,
      templateKeys: body.templateKeys,
      sections: body.sections,
      status: body.status,
    });
  }

  @Patch('categories/:id')
  updateCategoryContent(
    @Param('id') id: string,
    @Body()
    body: {
      categorySlug?: string;
      categoryName?: string;
      templateKeys?: Prisma.InputJsonValue;
      sections?: Prisma.InputJsonValue;
      status?: string;
    },
  ) {
    return this.contentsService.updateCategoryContent(id, body);
  }

  @Delete('categories')
  removeCategoryContent(@Query('id') id?: string) {
    if (!id) throw new BadRequestException('ID is required');
    return this.contentsService.removeCategoryContent(id);
  }
}
