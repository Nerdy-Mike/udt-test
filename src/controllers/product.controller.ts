import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {authorize} from '@loopback/authorization';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings, UserProfile, securityId} from '@loopback/security';

import {Product} from '../models';
import {ProductRepository} from '../repositories';
import {basicAuthorization} from '../middlewares/auth.midd';
export class ProductController {
  constructor(
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @inject(SecurityBindings.USER)
    private currentUserProfile: UserProfile,
  ) {}

  private async validateAgencyProduct(productId: string): Promise<void> {
    if (productId) {
      // get product by id
      const productExist = await this.productRepository.findOne({
        where: {productId: productId},
      });
      if (
        productExist &&
        productExist.agencyId !== this.currentUserProfile.id
      ) {
        throw new HttpErrors.Unauthorized(
          'You are not authorized to update this product',
        );
      }
    }
  }

  @post('/products')
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['agency'],
    voters: [basicAuthorization],
  })
  @response(200, {
    description: 'Product model instance',
    content: {'application/json': {schema: getModelSchemaRef(Product)}},
  })
  async create(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
    @requestBody({
      description: 'New product',
      required: true,
      content: {
        'application/json': {
          schema: getModelSchemaRef(Product, {
            title: 'NewProduct',
            exclude: ['productId', 'agencyId'],
          }),
        },
      },
    })
    product: Omit<Product, 'productId'>,
  ): Promise<Product> {
    if (currentUserProfile) {
      const agencyId = currentUserProfile[securityId];
      product.agencyId = agencyId;
    } else {
      throw new HttpErrors.Unauthorized('User not found');
    }
    return this.productRepository.create(product);
  }

  @get('/products/count')
  @response(200, {
    description: 'Product model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(Product) where?: Where<Product>): Promise<Count> {
    return this.productRepository.count(where);
  }

  @get('/products')
  @response(200, {
    description: 'Array of Product model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Product, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Product) filter?: Filter<Product>,
  ): Promise<Product[]> {
    return this.productRepository.find(filter);
  }

  @patch('/products')
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['agency'],
    voters: [basicAuthorization],
  })
  @response(200, {
    description: 'Product PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Product, {partial: true}),
        },
      },
    })
    product: Product,
    @param.where(Product) where?: Where<Product>,
  ): Promise<Count> {
    // only agency who created the product can update it
    await this.validateAgencyProduct(product.productId as string);
    return this.productRepository.updateAll(product, where);
  }

  @get('/products/{productId}')
  @response(200, {
    description: 'Product model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Product, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('productId') productId: string,
    @param.filter(Product, {exclude: 'where'})
    filter?: FilterExcludingWhere<Product>,
  ): Promise<Product> {
    return this.productRepository.findById(productId, filter);
  }

  @patch('/products/{productId}')
  @response(204, {
    description: 'Product PATCH success',
  })
  async updateById(
    @param.path.string('productId') productId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Product, {partial: true}),
        },
      },
    })
    product: Product,
  ): Promise<void> {
    await this.productRepository.updateById(productId, product);
  }

  @put('/products/{productId}')
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['agency'],
    voters: [basicAuthorization],
  })
  @response(204, {
    description: 'Product PUT success',
  })
  async replaceById(
    @param.path.string('productId') productId: string,
    @requestBody() product: Product,
  ): Promise<void> {
    await this.validateAgencyProduct(productId as string);

    await this.productRepository.replaceById(productId, product);
  }

  @del('/products/{productId}')
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['agency'],
    voters: [basicAuthorization],
  })
  @response(204, {
    description: 'Product DELETE success',
  })
  async deleteById(
    @param.path.string('productId') productId: string,
  ): Promise<void> {
    await this.validateAgencyProduct(productId as string);
    await this.productRepository.deleteById(productId);
  }
}
