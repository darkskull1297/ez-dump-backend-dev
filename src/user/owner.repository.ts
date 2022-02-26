import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import getOverlappingDaysInIntervals from 'date-fns/esm/fp/getOverlappingDaysInIntervals';
import { BaseRepository } from '../common/base.repository';
import { Owner } from './owner.model';
import { OwnerCompanyRepo } from '../company/owner-company.repository';
import { OwnerCompany } from '../company/owner-company.model';
import { OwnerPriority } from './owner-priority';

type CreateOwner = Partial<Omit<Owner, 'company'>> & { company: OwnerCompany };

@Injectable()
export class OwnerRepo extends BaseRepository<Owner, CreateOwner>(Owner) {
  constructor(
    @InjectRepository(Owner)
    private readonly ownerRepo: Repository<Owner>,
    private readonly ownerCompanyRepo: OwnerCompanyRepo,
  ) {
    super(ownerRepo);
  }

  async create({
    name,
    email,
    phoneNumber,
    password,
    company,
  }: CreateOwner): Promise<Owner> {
    const owner = this.ownerRepo.create({
      name,
      email,
      phoneNumber,
      password,
    });
    await this.ownerRepo.save(owner);

    await this.ownerCompanyRepo.create({
      ...company,
      owner: Promise.resolve(owner),
    });

    return owner;
  }

  async getOwnerById(id: string): Promise<Owner> {
    return this.ownerRepo
      .createQueryBuilder('owner')
      .where('owner.id = :id', { id })
      .getOne();
  }

  async getOwnersWithPriorityNotMaximum(): Promise<Owner[]> {
    return this.ownerRepo
      .createQueryBuilder('owner')
      .leftJoinAndSelect('owner.company', 'company')
      .andWhere('owner.priority <> :maximum', {
        maximum: OwnerPriority.MAXIMUM,
      })
      .getMany();
  }

  async getOwnersWithCompany(): Promise<Owner[]> {
    return this.ownerRepo.query(`select
              us."id",
              us."name", 
              us."email",
              us."phoneNumber",
              us."profileImg",
              us."verifiedByAdmin",
              us."priority",
              us."loggedToken",
              us."loggedDevice",
              company."companyCommonName"
                from 
                public.user us,
              public.owner_company company
                where company."ownerId" = us."id" and us."role" = 'OWNER'`);
  }

  async getOwnersWithCompanyForAdmin(): Promise<any[]> {
    return this.ownerRepo.query(`select
              us."id",
              us."name", 
              us."isDisable",
              us."isRestricted",
              us."email",
              us."phoneNumber",
              us."profileImg",
              us."verifiedByAdmin",
              us."priority",
              us."loggedToken",
              us."loggedDevice",
              company."companyCommonName"
                from 
                public.user us,
              public.owner_company company
                where company."ownerId" = us."id" and us."role" = 'OWNER'`);
  }

  async getOwners(): Promise<Owner[]> {
    return this.ownerRepo
      .createQueryBuilder('owner')
      .leftJoinAndSelect('owner.company', 'company')
      .getMany();
  }

  async getOwnerWithCompany(ownerId: string): Promise<Owner> {
    return this.ownerRepo.query(`select
              us."id",
              us."name", 
              us."email",
              us."phoneNumber",
              us."profileImg",
              us."verifiedByAdmin",
              us."priority",
              us."loggedToken",
              us."loggedDevice",
              company."companyCommonName"
                from 
                public.user us,
              public.owner_company company
                where us."id" = '${ownerId}' and company."ownerId" = us."id" and us."role" = 'OWNER'`);
  }

  async getOwnerCompany(ownerId: string): Promise<Owner> {
    return this.ownerRepo.query(`select
              company."companyCommonName"
                from 
                public.user us,
              public.owner_company company
                where us."id" = '${ownerId}' and company."ownerId" = us."id" and us."role" = 'OWNER'`);
  }
}
