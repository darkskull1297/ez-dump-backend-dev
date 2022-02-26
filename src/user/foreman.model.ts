import { ManyToOne, ChildEntity, ManyToMany, JoinTable } from 'typeorm';
import { ContractorCompany } from '../company/contractor-company.model';
import { GeneralJob } from '../general-jobs/general-job.model';
import { User, UserRole } from './user.model';

@ChildEntity(UserRole.FOREMAN)
export class Foreman extends User {
  role? = UserRole.FOREMAN;
  verifiedEmail? = true;

  @ManyToOne(
    () => ContractorCompany,
    company => company.foremans,
    { eager: true, onDelete: 'CASCADE' },
  )
  contractorCompany?: ContractorCompany;

  @ManyToMany(
    () => GeneralJob,
    generalJob => generalJob.foremans,
    { nullable: true, lazy: true },
  )
  @JoinTable()
  generalJobs?: GeneralJob[];
}
