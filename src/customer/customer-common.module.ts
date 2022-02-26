import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { CustomerService } from './customer.service';
import { CustomerRepo } from './customer.repository';
import { Customer } from './customer.model';
import { GeneralJob } from '../general-jobs/general-job.model';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GeneralJob, Customer]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => UserModule),
  ],
  providers: [CustomerRepo, CustomerService],
  exports: [CustomerRepo, CustomerService],
})
export class CustomerCommonModule {}
