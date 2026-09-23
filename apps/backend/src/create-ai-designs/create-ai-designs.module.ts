import { Module } from '@nestjs/common';
import { CreateAiDesignsController } from './create-ai-designs.controller';
import { CreateAiDesignsService } from './create-ai-designs.service';

@Module({
  controllers: [CreateAiDesignsController],
  providers: [CreateAiDesignsService],
  exports: [CreateAiDesignsService],
})
export class CreateAiDesignsModule {}
