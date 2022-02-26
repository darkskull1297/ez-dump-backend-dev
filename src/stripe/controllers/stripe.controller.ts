import { Controller, Post, Headers, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StripeEventsService } from '../stripe-events.service';

@ApiTags('stripe')
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeEventsService: StripeEventsService) {}

  @ApiOperation({ summary: 'Handle stripe events' })
  @Post('webhook')
  async handleEvents(
    @Headers('stripe-signature') signature: string,
      @Req() { rawBody }: any,
  ): Promise<boolean> {
    await this.stripeEventsService.handleEvent(rawBody, signature);
    return true;
  }
}
