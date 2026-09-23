import { Module } from '@nestjs/common';
import { AdminMailModule } from '../admin-mail/admin-mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailDispatchService } from './mail-dispatch.service';
import { DraftReminderService } from './draft-reminder.service';

@Module({
  imports: [AdminMailModule, NotificationsModule],
  providers: [MailDispatchService, DraftReminderService],
  exports: [MailDispatchService],
})
export class MailModule {}
