import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailDispatchService } from '../mail/mail-dispatch.service';
import { NotificationsService } from '../notifications/notifications.service';

const userPublicSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  gender: true,
  birthday: true,
  phone: true,
  nationality: true,
  location: true,
  address: true,
} as const;

type ProfileUpdateBody = {
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
};

function normalizeOptionalText(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

type LoginOtpEntry = {
  code: string;
  expiresAt: number;
  sentAt: number;
  attempts: number;
};

@Injectable()
export class UserAuthService {
  private readonly logger = new Logger(UserAuthService.name);
  private readonly loginOtps = new Map<string, LoginOtpEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailDispatch: MailDispatchService,
    private readonly notifications: NotificationsService,
  ) {}

  private notifyNewSignup(input: {
    userId: string;
    email: string;
    name?: string | null;
    provider: 'local' | 'google' | 'apple';
  }) {
    const providerLabel =
      input.provider === 'google'
        ? 'Google'
        : input.provider === 'apple'
          ? 'Apple'
          : 'Email';

    void this.mailDispatch
      .sendSignupNotifications({
        userEmail: input.email,
        userName: input.name || null,
        provider: input.provider,
      })
      .catch(() => undefined);

    void this.notifications
      .createAdminNotification({
        title: 'New user signup',
        body: `${input.name || input.email} joined via ${providerLabel}`,
        type: 'user_signup',
        href: '/users',
        meta: {
          userId: input.userId,
          email: input.email,
          provider: input.provider,
        },
      })
      .catch(() => undefined);

    void this.notifications
      .createUserNotification({
        userId: input.userId,
        title: 'Welcome to Lestow',
        body: 'Thanks for joining. Your account is ready — start building your first website anytime.',
        type: 'system',
        href: '/user/dashboard',
      })
      .catch(() => undefined);
  }

  async register(email: string, password: string, name?: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    if (!password || password.length < 6) {
      throw new ConflictException('Password must be at least 6 characters');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || null,
        passwordHash,
      },
      select: userPublicSelect,
    });

    this.notifyNewSignup({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: 'local',
    });

    const accessToken = await this.signToken(user);

    return { accessToken, user, isNewUser: true };
  }

  async sendLoginOtp(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new BadRequestException('Enter a valid email');
    }

    const existing = this.loginOtps.get(normalizedEmail);
    if (existing && Date.now() - existing.sentAt < 45_000) {
      throw new BadRequestException('Please wait before requesting another code');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.loginOtps.set(normalizedEmail, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
      sentAt: Date.now(),
      attempts: 0,
    });

    const mailed = await this.mailDispatch.sendLoginOtp({
      userEmail: normalizedEmail,
      code,
    });
    if (!mailed.sent) {
      this.logger.warn(
        `Login OTP for ${normalizedEmail} not emailed (${mailed.reason}). Code: ${code}`,
      );
    }

    return { message: 'We sent a 6-digit code to your email.' };
  }

  async verifyLoginOtp(email: string, code: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const otp = (code || '').replace(/\D/g, '');
    const entry = this.loginOtps.get(normalizedEmail);

    if (!entry || Date.now() > entry.expiresAt) {
      this.loginOtps.delete(normalizedEmail);
      throw new UnauthorizedException('Code expired. Request a new one.');
    }

    entry.attempts += 1;
    if (entry.attempts > 5) {
      this.loginOtps.delete(normalizedEmail);
      throw new UnauthorizedException('Too many attempts. Request a new code.');
    }
    if (otp !== entry.code) {
      throw new UnauthorizedException('Invalid code');
    }

    this.loginOtps.delete(normalizedEmail);

    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { ...userPublicSelect, status: true },
    });
    let isNewUser = false;

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          authProvider: 'local',
        },
        select: { ...userPublicSelect, status: true },
      });
      isNewUser = true;
      this.notifyNewSignup({
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: 'local',
      });
    }

    if (user.status !== 'Active') {
      throw new UnauthorizedException('Your account is inactive');
    }

    const publicUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      birthday: user.birthday,
      phone: user.phone,
      nationality: user.nationality,
      location: user.location,
      address: user.address,
    };

    return {
      accessToken: await this.signToken(publicUser),
      user: publicUser,
      isNewUser,
    };
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { ...userPublicSelect, passwordHash: true, status: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'Active') {
      throw new UnauthorizedException('Your account is inactive');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses Google or Apple sign-in. Continue with that provider.',
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const publicUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      birthday: user.birthday,
      phone: user.phone,
      nationality: user.nationality,
      location: user.location,
      address: user.address,
    };

    const accessToken = await this.signToken(publicUser);

    return {
      accessToken,
      user: publicUser,
    };
  }

  async oauthLogin(input: {
    provider: 'google' | 'apple';
    providerId: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
  }) {
    const provider = input.provider;
    const providerId = input.providerId?.trim();
    const normalizedEmail = input.email?.toLowerCase().trim();

    if (!providerId || !normalizedEmail) {
      throw new BadRequestException('OAuth profile is incomplete');
    }

    const byProvider = await this.prisma.user.findFirst({
      where: { authProvider: provider, providerId },
      select: { ...userPublicSelect, status: true },
    });

    let user = byProvider;
    let isNewUser = false;

    if (!user) {
      const byEmail = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { ...userPublicSelect, status: true, authProvider: true },
      });

      if (byEmail) {
        user = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: {
            authProvider: provider,
            providerId,
            name: byEmail.name || input.name?.trim() || null,
            avatarUrl: byEmail.avatarUrl || input.avatarUrl || null,
          },
          select: { ...userPublicSelect, status: true },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            name: input.name?.trim() || null,
            avatarUrl: input.avatarUrl || null,
            passwordHash: null,
            authProvider: provider,
            providerId,
          },
          select: { ...userPublicSelect, status: true },
        });
        isNewUser = true;
      }
    } else if (input.name || input.avatarUrl) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || input.name?.trim() || null,
          avatarUrl: user.avatarUrl || input.avatarUrl || null,
        },
        select: { ...userPublicSelect, status: true },
      });
    }

    if (user.status !== 'Active') {
      throw new UnauthorizedException('Your account is inactive');
    }

    if (isNewUser) {
      this.notifyNewSignup({
        userId: user.id,
        email: user.email,
        name: user.name,
        provider,
      });
    }

    const publicUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      birthday: user.birthday,
      phone: user.phone,
      nationality: user.nationality,
      location: user.location,
      address: user.address,
    };

    const accessToken = await this.signToken(publicUser);
    return { accessToken, user: publicUser, isNewUser };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ...userPublicSelect, createdAt: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async updateProfile(userId: string, body: ProfileUpdateBody) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!current) throw new UnauthorizedException();

    const nextName =
      body.name !== undefined ? body.name.trim() || null : current.name;
    const nextAvatarUrl =
      body.avatarUrl !== undefined ? body.avatarUrl : current.avatarUrl;
    const nextGender =
      body.gender !== undefined
        ? normalizeOptionalText(body.gender)
        : current.gender;
    const nextBirthday =
      body.birthday !== undefined
        ? normalizeOptionalText(body.birthday)
        : current.birthday;
    const nextPhone =
      body.phone !== undefined
        ? normalizeOptionalText(body.phone)
        : current.phone;
    const nextNationality =
      body.nationality !== undefined
        ? normalizeOptionalText(body.nationality)
        : current.nationality;
    const nextLocation =
      body.location !== undefined
        ? normalizeOptionalText(body.location)
        : current.location;
    const nextAddress =
      body.address !== undefined
        ? normalizeOptionalText(body.address)
        : current.address;

    let passwordHash = current.passwordHash;
    if (body.newPassword) {
      if (current.passwordHash) {
        if (!body.currentPassword) {
          throw new BadRequestException(
            'Current password is required to set a new password',
          );
        }
        const ok = await bcrypt.compare(
          body.currentPassword,
          current.passwordHash,
        );
        if (!ok) {
          throw new UnauthorizedException('Current password is incorrect');
        }
      }
      if (body.newPassword.length < 6) {
        throw new BadRequestException(
          'New password must be at least 6 characters',
        );
      }
      passwordHash = await bcrypt.hash(body.newPassword, 10);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: nextName,
        avatarUrl: nextAvatarUrl,
        gender: nextGender,
        birthday: nextBirthday,
        phone: nextPhone,
        nationality: nextNationality,
        location: nextLocation,
        address: nextAddress,
        passwordHash,
      },
      select: userPublicSelect,
    });

    const accessToken = await this.signToken(user);
    return { accessToken, user };
  }

  private signToken(user: {
    id: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
  }) {
    return this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'user',
    });
  }
}
