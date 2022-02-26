import { Injectable } from '@nestjs/common';

export interface Sender {
  sendEmail(
    to: string,
    subject: string,
    body: string,
    replyTo?: string,
  ): Promise<boolean>;
}

@Injectable()
export class SenderService {
  constructor(private readonly sender: Sender) {}

  sendEmail(prop: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    return this.sender.sendEmail(prop.to, prop.subject, prop.html);
  }
}
