import { NotificationModule } from './../notification/notification.module';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, forwardRef } from '@nestjs/common';
import { Problem } from './problem.model';
import { UserModule } from '../user/user.module';
import { ProblemRepo } from './problem.repository';
import { ProblemService } from './problem.service';
import { JobsModule } from '../jobs/jobs.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Problem]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UserModule,
    JobsModule,
    forwardRef(() => NotificationModule),
    EmailModule.forChild(),
  ],
  providers: [ProblemService, ProblemRepo],
  exports: [
    PassportModule,
    TypeOrmModule,
    ProblemService,
    ProblemRepo,
    EmailModule,
  ],
})
export class ProblemsCommonModule {}
