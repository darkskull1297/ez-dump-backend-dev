import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { Customer } from './customer.model';
import { User } from '../user/user.model';
import { Contractor } from '../user/contractor.model';

@Injectable()
export class CustomerRepo extends BaseRepository<Customer>(Customer) {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {
    super(customerRepository);
  }

  findCustomer(customerId: string, contractor: Contractor): Promise<Customer> {
    return this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.contractor', 'contractor')
      .where('customer.id = :customerId', { customerId })
      .andWhere('contractor.id = :id', { id: contractor.id })
      .getOne();
  }

  findCustomers(contractor: Contractor): Promise<Customer[]> {
    return this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.contractor', 'contractor')
      .where('contractor.id = :id', { id: contractor.id })
      .orderBy('customer.createdAt', 'ASC')
      .getMany();
  }
}
