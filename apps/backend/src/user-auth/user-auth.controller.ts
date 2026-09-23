import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('auth/user')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @Public()
  @Post('register')
  register(
    @Body() body: { email?: string; password?: string; name?: string },
  ) {
    const email = body.email?.trim();
    const password = body.password;
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }
    return this.userAuthService.register(email, password, body.name);
  }

  @Public()
  @Post('login')
  login(@Body() body: { email?: string; password?: string }) {
    const email = body.email?.trim();
    const password = body.password;
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }
    return this.userAuthService.login(email, password);
  }

  @Public()
  @Post('otp/send')
  sendLoginOtp(@Body() body: { email?: string }) {
    const email = body.email?.trim();
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.userAuthService.sendLoginOtp(email);
  }

  @Public()
  @Post('otp/verify')
  verifyLoginOtp(@Body() body: { email?: string; code?: string }) {
    const email = body.email?.trim();
    const code = body.code?.trim();
    if (!email || !code) {
      throw new UnauthorizedException('Email and code are required');
    }
    return this.userAuthService.verifyLoginOtp(email, code);
  }

  @Public()
  @Post('oauth')
  oauth(
    @Body()
    body: {
      provider?: 'google' | 'apple';
      providerId?: string;
      email?: string;
      name?: string | null;
      avatarUrl?: string | null;
    },
  ) {
    if (
      body.provider !== 'google' &&
      body.provider !== 'apple'
    ) {
      throw new BadRequestException('Unsupported OAuth provider');
    }
    return this.userAuthService.oauthLogin({
      provider: body.provider,
      providerId: body.providerId || '',
      email: body.email || '',
      name: body.name,
      avatarUrl: body.avatarUrl,
    });
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Get('me')
  me(@Req() req: { user: { sub: string } }) {
    return this.userAuthService.me(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @Patch('profile')
  updateProfile(
    @Req() req: { user: { sub: string } },
    @Body()
    body: {
      name?: string;
      avatarUrl?: string | null;
      gender?: string | null;
      birthday?: string | null;
      phone?: string | null;
      nationality?: string | null;
      location?: string | null;
      address?: string | null;
      currentPassword?: string;
      newPassword?: string;
    },
  ) {
    if (
      body.name === undefined &&
      body.avatarUrl === undefined &&
      body.gender === undefined &&
      body.birthday === undefined &&
      body.phone === undefined &&
      body.nationality === undefined &&
      body.location === undefined &&
      body.address === undefined &&
      !body.newPassword
    ) {
      throw new BadRequestException('Nothing to update');
    }
    return this.userAuthService.updateProfile(req.user.sub, body);
  }
}
