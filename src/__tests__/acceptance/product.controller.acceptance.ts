import {Client, expect} from '@loopback/testlab';
import {BeApplication} from '../..';
import {setupApplication} from './test-helper';
import {ProductRepository, UserRepository} from '../../repositories';
import {givenAdmin, givenAgency, givenProduct} from '../helpers/data';
import {UserRole} from '../../constants/role';

describe('PingController', () => {
  let app: BeApplication;
  let client: Client;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
    const admin = givenAdmin();
    const agency = givenAgency();
    // login with admin role
    const loginResponse = await client
      .post('/users/login')
      .send({email: admin.email, password: admin.password})
      .expect(200);
    const token = loginResponse.body.accessToken;
    const response = await client
      .post('/users/sign-up/agency')
      .set('Authorization', `Bearer ${token}`)
      .send(agency)
      .expect(200);

    expect(response.body.email).to.eql(agency.email);
  });

  after(async () => {
    const productRepository = await app.getRepository(ProductRepository);
    await productRepository.deleteAll();

    const userRepository = await app.getRepository(UserRepository);
    await userRepository.deleteAll({role: {neq: UserRole.Admin}});
    await userRepository.deleteAll({email: 'admin2@test.com'});
    await app.stop();
  });

  describe('Create new product as agency', () => {
    it('creates a new product', async () => {
      const agency = givenAgency();
      const product = givenProduct();

      // login with agency role
      const loginResponse = await client
        .post('/users/login')
        .send({email: agency.email, password: agency.password})
        .expect(200);
      // create new product
      const response = await client
        .post('/products')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send(product)
        .expect(200);
      // match sku and name
      expect(response.body.sku).to.eql(product.sku);
      expect(response.body.name).to.eql(product.name);
    });
  });
});
