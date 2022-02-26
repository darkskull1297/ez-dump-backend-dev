import { Test, TestingModule } from '@nestjs/testing';

import { EmailService } from './email.service';
import { TemplateService } from '../util/template/template.service';
import { SenderService } from './sender.service';

describe('EmailService', () => {
  let service: EmailService;
  let templateService: TemplateService;
  let senderService: SenderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: TemplateService,
          useValue: {
            templateToHTML: jest.fn(),
          },
        },
        {
          provide: SenderService,
          useValue: {
            sendEmail: jest.fn(() => true),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    templateService = module.get<TemplateService>(TemplateService);
    senderService = module.get<SenderService>(SenderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send email verification', async () => {
    const emailSent = await service.sendEmailVerification(
      'hansolo@gmail.com',
      'link',
    );
    expect(emailSent).toBeTruthy();
    expect(templateService.templateToHTML).toBeCalled();
    expect(senderService.sendEmail).toBeCalled();
  });

  it('should send driver credentials', async () => {
    const emailSent = await service.sendDriverCreds(
      'Han Solo',
      'hansolo@gmail.com',
      'password',
      'Yoda',
    );
    expect(emailSent).toBeTruthy();
    expect(templateService.templateToHTML).toBeCalled();
    expect(senderService.sendEmail).toBeCalled();
  });
});
