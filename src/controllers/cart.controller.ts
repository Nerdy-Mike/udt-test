import {
  Count,
  CountSchema,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';

import {inject} from '@loopback/core';
import {SecurityBindings, UserProfile} from '@loopback/security';

import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {Cart} from '../models';
import {
  CartRepository,
  ProductRepository,
  TransactionRepository,
} from '../repositories';
import {UserRole} from '../constants/role';
import {basicAuthorization} from '../middlewares/auth.midd';

export class CartController {
  constructor(
    @repository(CartRepository)
    public cartRepository: CartRepository,
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @repository(TransactionRepository)
    public transactionRepository: TransactionRepository,
    @inject(SecurityBindings.USER)
    private currentUserProfile: UserProfile,
  ) {}

  private async validateCustomerCart(cartId: string): Promise<void> {
    if (cartId) {
      // get cart by id
      const cartExist = await this.cartRepository.findOne({
        where: {cartId: cartId},
      });
      if (cartExist && cartExist.customerId !== this.currentUserProfile.id) {
        throw new HttpErrors.Unauthorized(
          'You are not authorized to update this cart',
        );
      }
    }
  }

  @post('/carts')
  @authenticate('jwt')
  @authorize({
    allowedRoles: [UserRole.User],
    voters: [basicAuthorization],
  })
  @response(200, {
    description: 'Cart model instance',
    content: {'application/json': {schema: getModelSchemaRef(Cart)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Cart, {
            title: 'New Cart',
            exclude: ['cartId', 'customerId', 'createAt', 'updatedAt'],
          }),
        },
      },
    })
    cart: Omit<Cart, 'cartId'>,
  ): Promise<Cart> {
    const customerId = this.currentUserProfile.id;
    // for each product in the cart, check if the product exists
    if (cart.items && cart.items.length > 0) {
      for (const item of cart.items) {
        const productExist = await this.productRepository.findOne({
          where: {productId: item.productId},
        });
        if (!productExist) {
          throw new HttpErrors.BadRequest('Product does not exist');
        } else if (productExist.quantityAvailable < item.quantity) {
          throw new HttpErrors.BadRequest('Product stock is not enough');
        }
      }
    }

    return this.cartRepository.create({
      ...cart,
      createAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerId,
    });
  }

  @get('/carts/count')
  @response(200, {
    description: 'Cart model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(Cart) where?: Where<Cart>): Promise<Count> {
    return this.cartRepository.count(where);
  }

  @get('/carts')
  @authenticate('jwt')
  @authorize({
    allowedRoles: [UserRole.User],
    voters: [basicAuthorization],
  })
  @response(200, {
    description: 'Array of Cart model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Cart, {includeRelations: true}),
        },
      },
    },
  })
  async find(): Promise<Cart> {
    // return newest updated cart first
    const carts = await this.cartRepository.find({
      order: ['updatedAt'],
    });
    return carts[0];
  }

  @patch('/carts')
  @response(200, {
    description: 'Cart PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Cart, {partial: true}),
        },
      },
    })
    cart: Cart,
    @param.where(Cart) where?: Where<Cart>,
  ): Promise<Count> {
    return this.cartRepository.updateAll(cart, where);
  }

  @get('/carts/{id}')
  @authenticate('jwt')
  @authorize({
    allowedRoles: [UserRole.User],
    voters: [basicAuthorization],
  })
  @response(200, {
    description: 'Cart model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Cart, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Cart, {exclude: 'where'}) filter?: FilterExcludingWhere<Cart>,
  ): Promise<Cart> {
    await this.validateCustomerCart(id);
    return this.cartRepository.findById(id, filter);
  }

  @patch('/carts/{id}')
  @authenticate('jwt')
  @authorize({
    allowedRoles: [UserRole.User],
    voters: [basicAuthorization],
  })
  @response(204, {
    description: 'Cart PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Cart, {partial: true}),
        },
      },
    })
    cart: Cart,
  ): Promise<void> {
    await this.validateCustomerCart(id);
    await this.cartRepository.updateById(id, cart);
  }

  @put('/carts/{id}')
  @authenticate('jwt')
  @authorize({
    allowedRoles: [UserRole.User],
    voters: [basicAuthorization],
  })
  @response(204, {
    description: 'Cart PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() cart: Cart,
  ): Promise<void> {
    await this.validateCustomerCart(id);
    await this.cartRepository.replaceById(id, cart);
  }

  @del('/carts/{id}')
  @authenticate('jwt')
  @authorize({
    allowedRoles: [UserRole.User],
    voters: [basicAuthorization],
  })
  @response(204, {
    description: 'Cart DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.validateCustomerCart(id);
    await this.cartRepository.deleteById(id);
  }

  // delete item in cart
  @del('/carts/{cartId}/items/{productId}')
  @authenticate('jwt')
  @authorize({
    allowedRoles: [UserRole.User],
    voters: [basicAuthorization],
  })
  @response(204, {
    description: 'Cart DELETE success',
  })
  async deleteItemInCart(
    @param.path.string('cartId') cartId: string,
    @param.path.string('productId') productId: string,
  ): Promise<void> {
    await this.validateCustomerCart(cartId);
    const cart = await this.cartRepository.findById(cartId);
    if (!cart) {
      throw new HttpErrors.NotFound('Cart not found');
    }
    if (cart.items && cart.items.length > 0) {
      const index = cart.items.findIndex(item => item.productId === productId);
      if (index > -1) {
        cart.items.splice(index, 1);
      }
    }
    await this.cartRepository.updateById(cartId, cart);
  }

  // pay for cart and create transaction, update product quantity, and delete cart
  @post('/carts/{cartId}/pay')
  @authenticate('jwt')
  @authorize({
    allowedRoles: [UserRole.User],
    voters: [basicAuthorization],
  })
  @response(200, {
    description: 'Transaction model instance',
    content: {'application/json': {schema: getModelSchemaRef(Cart)}},
  })
  async payForCart(@param.path.string('cartId') cartId: string): Promise<Cart> {
    await this.validateCustomerCart(cartId);
    const cart = await this.cartRepository.findById(cartId);
    if (!cart) {
      throw new HttpErrors.NotFound('Cart not found');
    }
    let totalAmount = 0;
    const fixedItems = [];
    if (cart.items && cart.items.length > 0) {
      for (const item of cart.items) {
        const product = await this.productRepository.findById(item.productId);
        if (product) {
          product.quantityAvailable -= item.quantity;
          await this.productRepository.updateById(item.productId, product);
          totalAmount += item.quantity * product.price;
          fixedItems.push({
            productId: item.productId,
            quantity: item.quantity,
            finalPrice: product.price,
          });
        }
      }
    }
    const transaction = await this.transactionRepository.create({
      customerId: this.currentUserProfile.id,
      items: fixedItems,
      status: 'paid',
      totalAmount: totalAmount,
    });
    await this.cartRepository.deleteById(cartId);
    return transaction;
  }
}
