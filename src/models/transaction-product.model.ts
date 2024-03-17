import {Entity, model, property} from '@loopback/repository';

@model()
export class TransactionProduct extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    useDefaultIdType: false,
    postgresql: {
      dataType: 'uuid',
    },
  })
  transactionProductId?: string;

  @property({
    type: 'string',
    required: true,
  })
  transactionId: string;

  @property({
    type: 'string',
    required: true,
  })
  productId: string;

  @property({
    type: 'number',
    required: true,
  })
  quantity: number;

  @property({
    type: 'number',
    required: true,
  })
  unitPrice: number;


  constructor(data?: Partial<TransactionProduct>) {
    super(data);
  }
}

export interface TransactionProductRelations {
  // describe navigational properties here
}

export type TransactionProductWithRelations = TransactionProduct & TransactionProductRelations;
