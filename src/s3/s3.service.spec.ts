// eslint-disable-next-line import/no-extraneous-dependencies
import { Test, TestingModule } from '@nestjs/testing';
import { S3 } from 'aws-sdk';
import { S3Service } from './s3.service';
import awsConfig from '../config/aws.config';

describe('S3Service', () => {
  let service: S3Service;
  let s3: S3;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: awsConfig.KEY,
          useValue: {},
        },
        {
          provide: S3,
          useValue: {
            getSignedUrlPromise: jest.fn(() => 'url'),
          },
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    s3 = module.get<S3>(S3);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get url to upload profile image', async () => {
    const url = await service.getUploadProfileImageUrl('obiwan');
    expect(url).toBeDefined();
    expect(typeof url).toBe('string');
    expect(s3.getSignedUrlPromise).toBeCalled();
  });
});
