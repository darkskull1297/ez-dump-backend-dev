import { Test, TestingModule } from '@nestjs/testing';

import { SenderService, Sender } from './sender.service';

describe('SenderService', () => {
  let service: SenderService;
  let sender: Sender;

  beforeEach(async () => {
    sender = { sendEmail: jest.fn(() => Promise.resolve(true)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SenderService,
          useValue: new SenderService(sender),
        },
      ],
    }).compile();

    service = module.get<SenderService>(SenderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send email verification', async () => {
    const emailSent = await service.sendEmail({
      to: 'hansolo@gmail.com',
      subject: 'Death star',
      html: '',
    });
    expect(sender.sendEmail).toBeCalled();
    expect(emailSent).toBeTruthy();
  });
});
