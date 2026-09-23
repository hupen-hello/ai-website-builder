import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { UserStateService } from './user-state.service';

@Controller('user-state')
export class UserStateController {
  constructor(private readonly userStateService: UserStateService) {}

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Get()
  getState(@Req() req: { user: { sub: string } }) {
    return this.userStateService.getState(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Put()
  saveState(
    @Req() req: { user: { sub: string } },
    @Body()
    body: {
      siteSubscriptions?: unknown;
      purchasedAddons?: unknown;
      purchasedDomains?: unknown;
      domainConnections?: unknown;
    },
  ) {
    return this.userStateService.saveState(req.user.sub, {
      siteSubscriptions: body.siteSubscriptions as never,
      purchasedAddons: body.purchasedAddons as never,
      purchasedDomains: body.purchasedDomains as never,
      domainConnections: body.domainConnections as never,
    });
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Get('razorpay')
  getRazorpay(@Req() req: { user: { sub: string } }) {
    return this.userStateService.getRazorpayMeta(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Post('razorpay/tokens')
  addRazorpayToken(
    @Req() req: { user: { sub: string } },
    @Body() body: { tokenId?: string; customerId?: string },
  ) {
    return this.userStateService.addRazorpayTokenId(
      req.user.sub,
      body.tokenId || '',
      body.customerId,
    );
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Delete('razorpay/tokens/:tokenId')
  removeRazorpayToken(
    @Req() req: { user: { sub: string } },
    @Param('tokenId') tokenId: string,
  ) {
    return this.userStateService.removeRazorpayTokenId(req.user.sub, tokenId);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Put('razorpay/customer')
  setRazorpayCustomer(
    @Req() req: { user: { sub: string } },
    @Body() body: { customerId?: string },
  ) {
    return this.userStateService.setRazorpayCustomerId(
      req.user.sub,
      body.customerId || '',
    );
  }
}
