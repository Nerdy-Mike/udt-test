import {Client, expect} from '@loopback/testlab';
import {BeApplication} from '../..';
import {setupApplication} from './test-helper';

import {
  CartRepository,
  ProductRepository,
  TransactionRepository,
  UserRepository,
} from '../../repositories';

import {
  givenAdmin,
  givenAgency,
  givenProduct,
  givenUser,
} from '../helpers/data';
import {UserRole} from '../../constants/role';

describe('Cart Controller test', () => {
  let app: BeApplication;
  let client: Client;

  let userAccessToken: string;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
    const user = givenUser();
    const response = await client.post('/users/sign-up').send(user).expect(200);
    // match email and role is user
    expect(response.body.email).to.eql(user.email);
    expect(response.body.role).to.eql(UserRole.User);
    const admin = givenAdmin();
    const agency = givenAgency();
    // login with admin role
    const loginResponse = await client
      .post('/users/login')
      .send({email: admin.email, password: admin.password})
      .expect(200);
    const adminToken = loginResponse.body.accessToken;

    const responseAgency = await client
      .post('/users/sign-up/agency')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(agency)
      .expect(200);
    expect(responseAgency.body.email).to.eql(agency.email);

    // login with agency role
    const responseAgencyLogin = await client
      .post('/users/login')
      .send({email: agency.email, password: agency.password})
      .expect(200);

    const agencyToken = responseAgencyLogin.body.accessToken;

    // create a product with agency role
    const product = givenProduct();
    const responseProduct = await client
      .post('/products')
      .set('Authorization', `Bearer ${agencyToken}`)
      .send(product)
      .expect(200);
    expect(responseProduct.body.sku).to.eql(product.sku);

    // login with user role
    const responseUserLogin = await client
      .post('/users/login')
      .send({email: user.email, password: user.password})
      .expect(200);

    userAccessToken = responseUserLogin.body.accessToken;
  });

  after(async () => {
    const userRepository = await app.getRepository(UserRepository);
    const productRepository = await app.getRepository(ProductRepository);
    const cartRepository = await app.getRepository(CartRepository);
    const transactionRepository = await app.getRepository(
      TransactionRepository,
    );
    await userRepository.deleteAll({role: {neq: UserRole.Admin}});
    await userRepository.deleteAll({email: 'admin2@test.com'});
    await productRepository.deleteAll();
    await cartRepository.deleteAll();
    await transactionRepository.deleteAll();
    await app.stop();
  });

  describe('Add product to cart ', () => {
    it('add product to cart when cart is not init', async () => {
      // get a product from api

      const productRepository = await app.getRepository(ProductRepository);

      const product = await productRepository.findOne();
      // add product to cart

      const response = await client
        .post('/carts')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({items: [{productId: product?.productId, quantity: 1}]})
        .expect(200);

      expect(response.body.items[0].productId).to.eql(product?.productId);

      console.log('response', response.body);
    });

    it('add product to cart when user cart is init', async () => {
      // get a product from api

      const productRepository = await app.getRepository(ProductRepository);

      const product = await productRepository.findOne();
      // add product to cart

      const response = await client
        .post('/carts')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({items: [{productId: product?.productId, quantity: 10}]})
        .expect(200);

      expect(response.body.items[0].quantity).to.eql(10);
      console.log('response', response.body);
    });
  });

  describe('Pay for existing cart ', () => {
    it('pay for existing cart', async () => {
      // get a product from api

      const cartRepository = await app.getRepository(CartRepository);
      const transactionRepository = await app.getRepository(
        TransactionRepository,
      );

      const cart = await cartRepository.findOne();
      console.log('cartAAAAA', cart);

      // pay for cart
      await client
        .post(`/carts/${cart?.cartId}/pay`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      // check if transaction is created
      const transaction = await transactionRepository.findOne();
      expect(transaction?.customerId).to.eql(cart?.customerId);
    });
  });
});
