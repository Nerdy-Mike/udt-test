import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDbDataSource} from '../datasources';
import {CartItem, CartItemRelations} from '../models';

export class CartItemRepository extends DefaultCrudRepository<
  CartItem,
  typeof CartItem.prototype.cartItemId,
  CartItemRelations
> {
  constructor(
    @inject('datasources.Postgres_db') dataSource: PostgresDbDataSource,
  ) {
    super(CartItem, dataSource);
  }
}