import { Injectable } from '@nestjs/common';
import { InjectTwilio, TwilioClient } from 'nestjs-twilio';

@Injectable()
export class MessagingService {
  public constructor(@InjectTwilio() private readonly client: TwilioClient) {}

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async sendSMS({ to, body }) {
    try {
      const response = await this.client.messages.create({
        body,
        from: '+19198997478',
        to,
      });
      console.log('response del text message', response);
      return response;
    } catch (e) {
      console.error(e);
      return e;
    }
  }
}
