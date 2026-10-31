import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { ActivityListener } from './activity.listener';

@Module({
  controllers: [ActivityController],
  providers: [ActivityService, ActivityListener],
  exports: [ActivityService],
})
export class ActivityModule {}
