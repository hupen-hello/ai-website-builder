import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SitesService } from './sites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Get('mine')
  listMine(@Req() req: { user: { sub: string } }) {
    return this.sitesService.listMine(req.user.sub);
  }

  @Public()
  @Get('public')
  listPublished() {
    return this.sitesService.listPublishedPublic();
  }

  @Public()
  @Get('public/:slug')
  findPublished(@Param('slug') slug: string) {
    return this.sitesService.findPublishedPublic(slug);
  }

  @Public()
  @Post('public/:slug/leads')
  createPublicLead(
    @Param('slug') slug: string,
    @Body()
    body: {
      formName?: string;
      formSection?: string;
      formPage?: string;
      fields?: Record<string, string>;
    },
  ) {
    return this.sitesService.createPublicLead(slug, body);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Get('leads/mine')
  listLeadsMine(@Req() req: { user: { sub: string } }) {
    return this.sitesService.listLeadsForOwner(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Patch(':id/title')
  updateTitle(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: { title?: string },
  ) {
    return this.sitesService.updateTitle(req.user.sub, id, body.title);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Patch(':id/slug')
  updateSlug(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: { slug?: string },
  ) {
    return this.sitesService.updateSlug(req.user.sub, id, body.slug);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Get(':id')
  findMine(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.sitesService.findMineById(req.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Delete(':id')
  remove(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.sitesService.deleteMine(req.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Post('migrate')
  migrate(
    @Req() req: { user: { sub: string } },
    @Body()
    body: {
      title?: string;
      templateId?: string;
      category?: string;
      siteId?: string;
      config?: {
        templateId?: string;
        category?: string;
        clientUpdatedAt?: number;
        pageLinks?: unknown;
        sections?: unknown;
        templateVariables?: unknown;
        businessInfo?: {
          audience?: string;
          name?: string;
          description?: string;
        } | null;
        seo?: Record<string, unknown> | null;
      };
    },
  ) {
    if (
      !body.templateId?.trim() &&
      (!body.config ||
        !Array.isArray(body.config.sections) ||
        !body.config.sections.length)
    ) {
      throw new BadRequestException(
        'templateId and at least one section are required',
      );
    }
    return this.sitesService.migrateGuestSite(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Post(':id/publish')
  publish(@Req() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.sitesService.publish(req.user.sub, id);
  }
}
