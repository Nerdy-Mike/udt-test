import {
  inject,
  /* inject, Application, CoreBindings, */
  lifeCycleObserver, // The decorator
  LifeCycleObserver, // The interface
} from '@loopback/core';
import {IsolationLevel, repository} from '@loopback/repository';

import {ProductRepository, UserRepository} from '../repositories';
import {givenAdmin} from '../__tests__/helpers/data';

import {PasswordHasherBindings, TokenServiceBindings} from '../keys';
import {JWTService, PasswordHasher} from '../services';

/**
 * This class will be bound to the application as a `LifeCycleObserver` during
 * `boot`
 */
@lifeCycleObserver('AddSeedData')
export class AddSeedDataObserver implements LifeCycleObserver {
  constructor(
    @repository(UserRepository) private userRepository: UserRepository,
    @repository(ProductRepository) private productRepository: ProductRepository,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: JWTService,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
  ) {}

  async init(): Promise<void> {
    // Add your logic for init
  }

  /**
   * This method will be invoked when the application starts.
   */
  async start(): Promise<void> {
    const tx = await this.userRepository.dataSource.beginTransaction(
      IsolationLevel.READ_COMMITTED,
    );

    try {
      // check if admin user already exists
      const adminUser = await this.userRepository.findOne({
        where: {role: 'admin'},
      });
      if (adminUser) {
        console.log('Admin user already exists:', adminUser);
        return;
      }

      const admin = givenAdmin();
      const password = await this.passwordHasher.hashPassword(admin.password);
      const savedAdmin = await this.userRepository.create(
        {
          email: admin.email,
          role: 'admin',
        },
        {transaction: tx},
      );

      await this.userRepository.userCredentials(savedAdmin.id).create(
        {
          password,
        },
        {
          transaction: tx,
        },
      );
      await tx.commit();
      console.log('Admin user created:', savedAdmin);
    } catch (error) {
      console.error('Error occurred while seeding data:', error);
    }
  }

  /**
   * This method will be invoked when the application stops.
   */
  async stop(): Promise<void> {
    // Add your logic for stop
  }
}
