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
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /** Public: user onboarding category picker */
  @Public()
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  create(
    @Body()
    body: {
      order?: number;
      name?: string;
      slug?: string;
      icon?: string;
      description?: string;
      status?: string;
    },
  ) {
    if (!body.name?.trim() || !body.slug?.trim()) {
      throw new BadRequestException('Name and slug are required');
    }
    return this.categoriesService.create({
      order: body.order,
      name: body.name,
      slug: body.slug,
      icon: body.icon,
      description: body.description,
      status: body.status,
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      order?: number;
      name?: string;
      slug?: string;
      icon?: string | null;
      description?: string | null;
      status?: string;
    },
  ) {
    return this.categoriesService.update(id, body);
  }

  @Delete()
  remove(@Query('id') id?: string) {
    if (!id) throw new BadRequestException('ID is required');
    return this.categoriesService.remove(id);
  }
}
