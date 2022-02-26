import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import request from 'aws-sdk/lib/request';
import error from 'aws-sdk/lib/error';
import * as AWS from 'aws-sdk';

import awsConfig from '../config/aws.config';

@Injectable()
export class S3Service {
  constructor(
    @Inject(awsConfig.KEY)
    private readonly awsConf: ConfigType<typeof awsConfig>,
    private readonly s3: S3,
  ) {}

  getUploadProfileImageUrl(userId: string): Promise<string> {
    return this.s3.getSignedUrlPromise('putObject', {
      Bucket: this.awsConf.bucketName,
      Key: `${userId}-${uuid()}-profile.jpg`,
      Expires: 1800,
      ACL: 'public-read',
      ContentType: 'image/jpeg',
    });
  }

  getUploadSignatureDriverImageUrl(driverId: string): Promise<string> {
    return this.s3.getSignedUrlPromise('putObject', {
      Bucket: this.awsConf.bucketName,
      Key: `${driverId}-${uuid()}-signature.jpg`,
      Expires: 1800,
      ACL: 'public-read',
      ContentType: 'image/jpg',
    });
  }

  getUploadInspectionImageURL(title: string): Promise<string> {
    return this.s3.getSignedUrlPromise('putObject', {
      Bucket: this.awsConf.bucketName,
      Key: `${title}-${uuid()}-${new Date().toISOString()}.jpg`,
      Expires: 50000,
      ACL: 'public-read',
      ContentType: 'image/jpeg',
    });
  }

  async UploadImage(stream: any): Promise<S3.ManagedUpload.SendData> {
    console.log('pase');
    console.log(stream);
    try {
      const params = {
        Bucket: 'formw9',
        Key: stream.originalname,
        Body: stream.buffer,
      };
      const response = await this.s3.upload(params).promise();
      return response;
    } catch (e) {
      console.log(e);
      return undefined;
    }
  }

  async DeleteFile(
    id: string,
  ): Promise<request.PromiseResult<S3.DeleteObjectOutput, error.AWSError>> {
    try {
      const params = {
        Bucket: 'formw9',
        Key: id,
      };
      const response = await this.s3.deleteObject(params).promise();
      return response;
    } catch (e) {
      console.log(e);
      console.log('Error deleting S3 file.');
      return undefined;
    }
  }

  getUploadImageImageUrl(
    jobId: string,
    jobAssignationId: string,
  ): Promise<string> {
    return this.s3.getSignedUrlPromise('putObject', {
      Bucket: this.awsConf.bucketName,
      Key: `${jobId}-${jobAssignationId}-${uuid()}.png`,
      Expires: 1800,
      ACL: 'public-read',
      ContentType: 'image/png',
    });
  }

  getImageUrlForDisputes(): Promise<string> {
    return this.s3.getSignedUrlPromise('putObject', {
      Bucket: this.awsConf.bucketName,
      Key: `${new Date().toISOString()}-${uuid()}-disputes.png`,
      Expires: 1800,
      ACL: 'public-read',
      ContentType: 'image/png',
    });
  }
}
