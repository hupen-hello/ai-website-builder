import { Module } from '@nestjs/common';
import { AdminMailController } from './admin-mail.controller';
import { AdminMailService } from './admin-mail.service';

@Module({
  controllers: [AdminMailController],
  providers: [AdminMailService],
  exports: [AdminMailService],
})
export class AdminMailModule {}
