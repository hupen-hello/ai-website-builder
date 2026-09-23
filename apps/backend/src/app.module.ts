import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { LayoutsModule } from './layouts/layouts.module';
import { TemplatesModule } from './templates/templates.module';
import { ContentsModule } from './contents/contents.module';
import { UserAuthModule } from './user-auth/user-auth.module';
import { SitesModule } from './sites/sites.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { UserStateModule } from './user-state/user-state.module';
import { SupportTicketsModule } from './support-tickets/support-tickets.module';
import { SmtpModule } from './smtp/smtp.module';
import { AdminMailModule } from './admin-mail/admin-mail.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CreateAiDesignsModule } from './create-ai-designs/create-ai-designs.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserAuthModule,
    SitesModule,
    UserStateModule,
    AdminUsersModule,
    SupportTicketsModule,
    SmtpModule,
    AdminMailModule,
    MailModule,
    NotificationsModule,
    CreateAiDesignsModule,
    CategoriesModule,
    LayoutsModule,
    TemplatesModule,
    ContentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
