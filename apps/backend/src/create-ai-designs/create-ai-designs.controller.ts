import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { CreateAiDesignsService } from './create-ai-designs.service';

@Controller('user/create-ai-designs')
@UseGuards(JwtAuthGuard, UserAuthGuard)
export class CreateAiDesignsController {
  constructor(private readonly createAiDesignsService: CreateAiDesignsService) {}

  @Get()
  listMine(@Req() req: { user: { sub: string } }) {
    return this.createAiDesignsService.listMine(req.user.sub);
  }

  @Get(':designKey')
  getMine(
    @Req() req: { user: { sub: string } },
    @Param('designKey') designKey: string,
  ) {
    return this.createAiDesignsService.getMine(req.user.sub, designKey);
  }

  @Put()
  upsertMine(
    @Req() req: { user: { sub: string } },
    @Body()
    body: {
      designKey?: string;
      title?: string;
      brandName?: string;
      category?: string;
      pageType?: string;
      pageCount?: number;
      pageLabels?: unknown;
      status?: string;
      payload?: unknown;
      site?: unknown;
      chat?: unknown;
    },
  ) {
    return this.createAiDesignsService.upsertMine(req.user.sub, body);
  }

  @Delete(':designKey')
  removeMine(
    @Req() req: { user: { sub: string } },
    @Param('designKey') designKey: string,
  ) {
    return this.createAiDesignsService.removeMine(req.user.sub, designKey);
  }
}
