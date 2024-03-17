import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, createBindingFromClass} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {
  AuthenticationComponent,
  registerAuthenticationStrategy,
} from '@loopback/authentication';
import {AuthorizationComponent} from '@loopback/authorization';

import {
  MyUserService,
  TokenServiceBindings,
  JWTAuthenticationComponent,
  UserServiceBindings,
  TokenServiceConstants,
  JWTService,
} from '@loopback/authentication-jwt';

import {PostgresDbDataSource} from './datasources';

import {MySequence} from './sequence';
import {PasswordHasherBindings} from './keys';
import {BcryptHasher} from './services';
import {JWTAuthenticationStrategy} from './authentication-strategies/jwt-strategy';

export {ApplicationConfig};

export class BeApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  private setUpBindings(): void {
    // Bind package.json to the application context
    // this.bind(PackageKey).to(pkg);

    this.bind(TokenServiceBindings.TOKEN_SECRET).to(
      TokenServiceConstants.TOKEN_SECRET_VALUE,
    );

    this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to(
      TokenServiceConstants.TOKEN_EXPIRES_IN_VALUE,
    );

    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);

    // Bind bcrypt hash services
    this.bind(PasswordHasherBindings.ROUNDS).to(10);
    this.bind(PasswordHasherBindings.PASSWORD_HASHER).toClass(BcryptHasher);

    this.bind(UserServiceBindings.USER_SERVICE).toClass(MyUserService);
  }

  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Set up the datasource
    this.component(AuthenticationComponent);
    this.component(AuthorizationComponent);
    this.component(JWTAuthenticationComponent);
    this.dataSource(PostgresDbDataSource, UserServiceBindings.DATASOURCE_NAME);

    this.setUpBindings();
    this.add(createBindingFromClass(JWTAuthenticationStrategy));
    registerAuthenticationStrategy(this, JWTAuthenticationStrategy);

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}
