import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      name: 'css-ai-builder-api',
      message: 'NestJS backend is running',
    };
  }
}
