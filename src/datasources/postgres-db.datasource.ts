import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'Postgres_db',
  connector: 'postgresql',
  url: '',
  host: '127.0.0.1',
  port: 5432,
  user: 'my_user',
  password: 'my_password',
  database: 'my_database'
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class PostgresDbDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'Postgres_db';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.Postgres_db', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
