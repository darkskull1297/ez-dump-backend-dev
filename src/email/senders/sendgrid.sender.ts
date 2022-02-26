import { Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { Sender } from '../sender.service';
import emailConfig from '../../config/email.config';

export class SendgridSender implements Sender {
  private readonly logger = new Logger('SenderService - SendgridSender', true);
  constructor(private readonly emailConf: ConfigType<typeof emailConfig>) {
    sgMail.setApiKey(emailConf.sgKey);
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      await sgMail.send({
        to,
        from: this.emailConf.sgFrom,
        subject,
        html: body,
      });
      return true;
    } catch (e) {
      this.logger.error(`Error on sending email to ${to}`, e);
      return false;
    }
  }
}
