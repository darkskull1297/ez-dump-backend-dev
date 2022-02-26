import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Param,
  Delete,
  Body,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { S3 } from 'aws-sdk';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import request from 'aws-sdk/lib/request';
import error from 'aws-sdk/lib/error';

import { S3Service } from './s3.service';

export class DeleteFileDto {
  @ApiProperty({ description: 'ID of the element to be deleted' })
  @IsString()
  id: string;
}

@Controller('s3')
export class S3Controller {
  constructor(private S3Serv: S3Service) {}
  @Post('upload')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFile(@UploadedFiles() file): Promise<S3.ManagedUpload.SendData> {
    const response = await this.S3Serv.UploadImage(file[0]);
    return response;
  }

  @Post('delete')
  async deleteFile(
    @Body() deleteFileDto: DeleteFileDto,
  ): Promise<request.PromiseResult<S3.DeleteObjectOutput, error.AWSError>> {
    // const response = await this.S3.UploadImage(file[0]);
    const response = await this.S3Serv.DeleteFile(deleteFileDto.id);
    return response;
  }
}
