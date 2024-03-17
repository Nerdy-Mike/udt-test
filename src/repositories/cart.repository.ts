import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDbDataSource} from '../datasources';
import {Cart, CartRelations} from '../models';

export class CartRepository extends DefaultCrudRepository<
  Cart,
  typeof Cart.prototype.cartId,
  CartRelations
> {
  constructor(
    @inject('datasources.Postgres_db') dataSource: PostgresDbDataSource,
  ) {
    super(Cart, dataSource);
  }
}
