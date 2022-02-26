import { Injectable } from '@nestjs/common';
import { Customer } from './customer.model';
import { CustomerRepo } from './customer.repository';
import { User } from '../user/user.model';
import { DocumentNotFoundException } from '../common/exceptions/document-not-found.exception';
import { UserRepo } from '../user/user.repository';
import { Contractor } from '../user/contractor.model';
import { Foreman } from '../user/foreman.model';

@Injectable()
export class CustomerService {
  constructor(
    private readonly customerRepo: CustomerRepo,
    private readonly userRepository: UserRepo,
  ) {}

  async findCustomers(user: User): Promise<Customer[]> {
    const customers = await this.customerRepo.findCustomers(user);
    return customers;
  }

  async findCustomersForeman(user: Foreman): Promise<Customer[]> {
    const contractor = await user.contractorCompany.contractor;
    const customers = await this.customerRepo.findCustomers(contractor);
    return customers;
  }

  async findCustomer(customerId: string, user: User): Promise<Customer> {
    return this.customerRepo.findCustomer(customerId, user);
  }

  async createCustomer(customer, contractor: Contractor): Promise<Customer> {
    return this.customerRepo.create({
      ...customer,
      contractor,
    });
  }

  async editCustomer(customer, Id: string): Promise<Customer> {
    const newCustomer = await this.customerRepo.findOne({ id: Id });

    if (!newCustomer) {
      throw new DocumentNotFoundException(' not found');
    }

    newCustomer.name = customer.name;
    newCustomer.address = customer.address;
    newCustomer.phoneNumber = customer.phoneNumber;
    return this.customerRepo.save(newCustomer);
  }

  async removeCustomer(customerId: string): Promise<boolean> {
    try {
      await this.customerRepo.remove(customerId);
      return true;
    } catch (err) {
      throw new Error(err);
    }
  }
}
