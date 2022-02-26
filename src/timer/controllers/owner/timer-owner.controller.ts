import { Controller, Put, Param, UseGuards, Body } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { UserRole, User } from '../../../user/user.model';
import { TimerService } from '../../timer.service';
import { FinishJobDTO } from '../../dto/finish-job.dto';

@ApiUnauthorizedResponse({
  description: 'Invalid token',
  type: FailureStringResponse,
})
@ApiForbiddenResponse({
  description: 'Invalid Role',
  type: FailureStringResponse,
})
@ApiBearerAuth('authorization')
@UseGuards(AuthGuard(), HasRole(UserRole.OWNER))
@ApiTags('timer')
@Controller('owner/timer')
export class TimerOwnerController {
  constructor(private readonly timerService: TimerService) {}

  @ApiOperation({
    summary: 'Update DriverInvoiceOwner',
    description: 'Returns update driver invoice',
  })
  @Put(':id/')
  async updateDriverInvoiceOwner(
    @Param('id') id: string,
      @Body() body: FinishJobDTO,
  ): Promise<any> {
    const driverInvoice = await this.timerService.updateDriverInvoiceOwner(
      id,
      body,
    );
    return driverInvoice;
  }
}
