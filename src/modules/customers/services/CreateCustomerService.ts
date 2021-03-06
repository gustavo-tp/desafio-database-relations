import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ name, email }: IRequest): Promise<Customer> {
    const findUserWithSameEmail = await this.customersRepository.findByEmail(
      email,
    );

    if (findUserWithSameEmail) {
      throw new AppError('Already exists a user with a same e-mail');
    }

    const costumer = await this.customersRepository.create({ name, email });

    return costumer;
  }
}

export default CreateCustomerService;
