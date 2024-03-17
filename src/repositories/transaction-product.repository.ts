import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDbDataSource} from '../datasources';
import {TransactionProduct, TransactionProductRelations} from '../models';

export class TransactionProductRepository extends DefaultCrudRepository<
  TransactionProduct,
  typeof TransactionProduct.prototype.transactionProductId,
  TransactionProductRelations
> {
  constructor(
    @inject('datasources.Postgres_db') dataSource: PostgresDbDataSource,
  ) {
    super(TransactionProduct, dataSource);
  }
}
