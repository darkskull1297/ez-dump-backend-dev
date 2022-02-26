import { Controller, UseGuards, Post, Body, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { UserRole, User } from '../../../user/user.model';
import { CurrentUser } from '../../../user/current-user.decorator';
import { ProblemDTO } from '../../dto/problem.dto';
import { ProblemService } from '../../problem.service';

@ApiUnauthorizedResponse({
  description: 'Invalid token',
  type: FailureStringResponse,
})
@ApiForbiddenResponse({
  description: 'Invalid Role',
  type: FailureStringResponse,
})
@ApiBearerAuth('authorization')
@UseGuards(AuthGuard(), HasRole(UserRole.DRIVER))
@ApiTags('problems')
@Controller('driver/problems')
export class ProblemsDriverController {
  constructor(private readonly problemService: ProblemService) {}

  @ApiOperation({ summary: 'Create problem report' })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @Post('/job/:id')
  async createProblemReport(
    @CurrentUser() user: User,
      @Body() problem: ProblemDTO,
      @Param('id') jobId: string,
  ): Promise<string> {
    await this.problemService.create(problem.toModel(user), user, jobId);
    return 'Problem reported successfully';
  }
}
