import { Module } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { ConfigType } from '@nestjs/config';

import awsConfig from '../config/aws.config';
import { S3Service } from './s3.service';
import { S3Controller } from './s3.controller';

@Module({
  providers: [
    {
      provide: S3,
      useFactory: (awsConf: ConfigType<typeof awsConfig>) =>
        new S3({
          region: awsConf.region,
          accessKeyId: awsConf.accessKeyId,
          secretAccessKey: awsConf.secretAccessKey,
          signatureVersion: 'v4',
        }),
      inject: [awsConfig.KEY],
    },
    S3Service,
  ],
  controllers: [S3Controller],
  exports: [S3Service, S3],
})
export class S3Module {}
