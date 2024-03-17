import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDbDataSource} from '../datasources';
import {Transaction, TransactionRelations} from '../models';

export class TransactionRepository extends DefaultCrudRepository<
  Transaction,
  typeof Transaction.prototype.transactionId,
  TransactionRelations
> {
  constructor(
    @inject('datasources.Postgres_db') dataSource: PostgresDbDataSource,
  ) {
    super(Transaction, dataSource);
  }
}
