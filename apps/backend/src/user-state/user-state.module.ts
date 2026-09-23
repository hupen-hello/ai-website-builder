import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserStateController } from './user-state.controller';
import { UserStateService } from './user-state.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserStateController],
  providers: [UserStateService],
})
export class UserStateModule {}
