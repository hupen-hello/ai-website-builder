import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async onModuleInit() {
    await this.ensureAdminSeed();
  }

  private async ensureAdminSeed() {
    const email = process.env.ADMIN_EMAIL || 'admin@cssfounder.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';
    const existing = await this.prisma.admin.findUnique({ where: { email } });
    if (existing) return;

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.admin.create({
      data: {
        email,
        name: 'Admin User',
        passwordHash,
      },
    });
    console.log(`Seeded admin: ${email}`);
  }

  async login(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwt.signAsync({
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'ADMIN',
      type: 'admin',
    });

    return {
      accessToken,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'ADMIN',
      },
    };
  }

  async me(adminId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        location: true,
        state: true,
        zip: true,
        avatarUrl: true,
      },
    });
    if (!admin) throw new UnauthorizedException();
    return { ...admin, role: 'ADMIN' };
  }

  async updateProfile(
    adminId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
      state?: string;
      zip?: string;
      avatarUrl?: string;
    },
  ) {
    if (data.email) {
      const email = data.email.toLowerCase().trim();
      const taken = await this.prisma.admin.findFirst({
        where: { email, NOT: { id: adminId } },
      });
      if (taken) throw new ConflictException('Email already in use');
      data.email = email;
    }

    const admin = await this.prisma.admin.update({
      where: { id: adminId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        state: data.state,
        zip: data.zip,
        avatarUrl: data.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        location: true,
        state: true,
        zip: true,
        avatarUrl: true,
      },
    });

    return { ...admin, role: 'ADMIN' };
  }

  async changePassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });
    if (!admin) throw new UnauthorizedException();

    const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new ConflictException('New password must be at least 6 characters');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.admin.update({
      where: { id: adminId },
      data: { passwordHash },
    });

    return { message: 'Password updated' };
  }
}
