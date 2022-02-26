import { Module } from '@nestjs/common';
import { ReviewsCommonModule } from './reviews-common.module';

@Module({
  imports: [ReviewsCommonModule],
  exports: [ReviewsCommonModule],
})
export class ReviewsModule {}
