import { Module, DynamicModule, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { ConfigType } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { SenderService } from './sender.service';
import { SendgridSender } from './senders/sendgrid.sender';
import { TemplateModule } from '../util/template/template.module';
import emailConfig from '../config/email.config';

interface EmailModuleOptions {
  sender: string;
  disableEmailModule: boolean;
  exposeTemplateEndpoint: boolean;
}

const EMAIL_MODULE_OPTIONS = 'EMAIL_MODULE_OPTIONS'; 

@Module({})
export class EmailModule {
  private static readonly logger = new Logger('EmailModule', true);
  private static SenderInstance;
  private static onSenderInstanceAvailable = new Subject<void>();
  static moduleOptionsStatic;

  static forRoot(options: EmailModuleOptions): DynamicModule {
    this.logger.log(`Using ${options.sender} Sender`);

    const controllers = options.exposeTemplateEndpoint ? [EmailController] : undefined;
    return {
      module: EmailModule,
      imports: [
        TemplateModule,
      ],
      providers: [
        EmailService,
        {
          provide: SenderService,
          useFactory: (emailConf: ConfigType<typeof emailConfig>) => {
            let instance;
            if (options.disableEmailModule) {
              instance = new SenderService({
                async sendEmail(
                  to: string,
                  subject: string,
                  body: string,
                  replyTo?: string,
                ) {
                  EmailModule.logger.warn(`Could not send email with subject "${subject}" since the Email Module is disabled.`);
                  return true;
                },
              });
            } else {
              switch (options.sender) {
                case 'SENDGRID':
                  instance = new SenderService(new SendgridSender(emailConf));
                  break;
                default:
                  throw this.logger.error('Invalid Sender');
              }
            }
            this.SenderInstance = instance;
            this.onSenderInstanceAvailable.next();
            return instance;
          },
          inject: [emailConfig.KEY],
        },
      ],
      exports: [EmailService],
      controllers,
    };
  }

  static forRootAsync(asyncProperties: {
    inject?: any[],
    useFactory: (
      ...args: any[]
    ) => Promise<EmailModuleOptions> | EmailModuleOptions,
  }): DynamicModule {
    return {
      module: EmailModule,
      imports: [
        TemplateModule,
      ],
      providers: [
        {
          provide: `${EMAIL_MODULE_OPTIONS}_INTERNAL`,
          useFactory: asyncProperties.useFactory,
          inject: asyncProperties.inject,
        },
        {
          provide: EMAIL_MODULE_OPTIONS,
          useFactory: (moduleOptions: EmailModuleOptions) => {
            this.moduleOptionsStatic = moduleOptions;
            return moduleOptions;
          },
          inject: [`${EMAIL_MODULE_OPTIONS}_INTERNAL`],
        },
        EmailService,
        {
          provide: SenderService,
          useFactory: (
            options: EmailModuleOptions,
            emailConf: ConfigType<typeof emailConfig>,
          ) => {
            let instance;
            if (options.disableEmailModule || emailConf.sgKey === undefined) {
              instance = new SenderService({
                async sendEmail(
                  to: string,
                  subject: string,
                  body: string,
                  replyTo?: string,
                ) {
                  EmailModule.logger.warn(`Could not send email with subject "${subject}" since the Email Module is disabled.`);
                  return true;
                },
              });
            } else {
              switch (options.sender) {
                case 'SENDGRID':
                  instance = new SenderService(new SendgridSender(emailConf));
                  break;
                default:
                  throw this.logger.error('Invalid Sender');
              }
            }
            this.SenderInstance = instance;
            this.onSenderInstanceAvailable.next();
            return instance;
          },
          inject: [EMAIL_MODULE_OPTIONS, emailConfig.KEY],
        },
      ],
      exports: [EmailService],
      controllers: process.env.EXPOSE_TEMPLATE_ENDPOINT ? [EmailController] : undefined, 
    }
  }

  static forChild(): DynamicModule {
    return {
      module: EmailModule,
      imports: [
        TemplateModule,
      ],
      providers: [
        EmailService,
        {
          provide: SenderService,
          useFactory: async () => new Promise(resolve => {
            this.onSenderInstanceAvailable.subscribe(() => {
              resolve(this.SenderInstance);
            });
          }),
        },
      ],
      exports: [EmailService],
    };
  }
}
