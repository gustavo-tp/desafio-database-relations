import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer dont exists');
    }

    const findedProducts = await this.productsRepository.findAllById(products);

    if (findedProducts.length === 0) {
      throw new AppError('No products found');
    }

    const orderProducts = products.map(product => {
      const findedProduct = findedProducts.find(
        currentProduct => currentProduct.id === product.id,
      );

      if (!findedProduct) {
        throw new AppError('Some products were not found');
      }

      if (findedProduct.quantity < product.quantity) {
        throw new AppError('Insufficient stock for some products');
      }

      findedProduct.quantity -= product.quantity;

      return {
        product_id: findedProduct.id,
        price: findedProduct.price,
        quantity: product?.quantity || 0,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    if (order) {
      await this.productsRepository.updateQuantity(findedProducts);
    }

    return order;
  }
}

export default CreateOrderService;
