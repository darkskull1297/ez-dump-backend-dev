import { Module } from '@nestjs/common';
import { TwilioModule } from 'nestjs-twilio';
import { ConfigType } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import twilioConfig from '../config/twilio.config';

@Module({
  imports: [
    TwilioModule.forRootAsync({
      useFactory: (twilioConf: ConfigType<typeof twilioConfig>) => ({
        accountSid: twilioConf.accountSid,
        authToken: twilioConf.authToken,
      }),
      inject: [twilioConfig.KEY],
    }),
    // TwilioModule.forRoot({
    //   accountSid: twilioConfig.,
    //   authToken: '94719d5b92c4f24960ef294713ea5a66',
    // }),
  ],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
