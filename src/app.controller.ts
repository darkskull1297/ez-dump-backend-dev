import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiAcceptedResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import errorCodes, { ErrorCode } from './common/error-codes';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Returns the current backend version number' })
  @ApiAcceptedResponse({
    description: 'Backend semantic version',
    type: String,
  })
  @Get()
  async getHello(): Promise<string> {
    return this.appService.getVersion();
  }

  @ApiOperation({ summary: 'Returns json with possible error codes' })
  @Get('error-codes')
  async getErrorCodes(): Promise<Record<string, ErrorCode>> {
    return {
      ...errorCodes,
      NULL000: {
        code: 'NULL000',
        msg: 'Generic Error',
      },
      AUTH998: {
        code: 'AUTH998',
        msg: 'Unauthorized',
      },
      AUTH999: {
        code: 'AUTH999',
        msg: 'Forbidden',
      },
      BREQ999: {
        code: 'BREQ999',
        msg: 'Bad Request',
      },
    };
  }

  @Get('test')
  async test(): Promise<boolean> {
    return true;
  }
}
