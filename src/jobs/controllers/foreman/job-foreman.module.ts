import { Module, forwardRef } from '@nestjs/common';
import { JobForemanController } from './job-foreman.controller';
import { JobsCommonModule } from '../../jobs-common.module';
import { UserService } from '../../../user/user.service';
import { UserModule } from '../../../user/user.module';
import { S3Module } from '../../../s3/s3.module';
import { StripeModule } from '../../../stripe/stripe.module';
import { TimerModule } from '../../../timer/timer.module';
import { TrucksModule } from '../../../trucks/trucks.module';
import { ReviewsModule } from '../../../reviews/reviews.module';

@Module({
  imports: [
    JobsCommonModule,
    forwardRef(() => UserModule),
    forwardRef(() => StripeModule),
    S3Module,
    TimerModule,
    TrucksModule,
    ReviewsModule,
  ],
  providers: [UserService],
  controllers: [JobForemanController],
})
export class JobForemanModule {}
