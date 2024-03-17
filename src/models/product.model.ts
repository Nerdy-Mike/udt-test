import {Entity, model, property} from '@loopback/repository';

@model()
export class Product extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    useDefaultIdType: false,
    postgresql: {
      dataType: 'uuid',
    },
  })
  productId?: string;

  @property({
    type: 'string',
    required: true,
  })
  agencyId: string;

  @property({
    type: 'string',
    required: true,
  })
  sku: string;

  @property({
    type: 'string',
  })
  name?: string;

  @property({
    type: 'string',
    required: true,
  })
  description: string;

  @property({
    type: 'number',
    required: true,
    postgresql: {
      dataType: 'numeric',
    },
  })
  price: number;

  @property({
    type: 'number',
    required: true,
  })
  quantityAvailable: number;

  constructor(data?: Partial<Product>) {
    super(data);
  }
}

export interface ProductRelations {
  // describe navigational properties here
}

export type ProductWithRelations = Product & ProductRelations;
