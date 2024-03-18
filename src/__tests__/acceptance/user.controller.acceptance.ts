import {Client, expect} from '@loopback/testlab';
import {BeApplication} from '../..';
import {setupApplication} from './test-helper';

import {UserRepository} from '../../repositories';

import {
  givenAdmin,
  givenAdminUser,
  givenAgency,
  givenUser,
} from '../helpers/data';
import {UserRole} from '../../constants/role';

describe('User Controller test', () => {
  let app: BeApplication;
  let client: Client;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
  });

  after(async () => {
    const userRepository = await app.getRepository(UserRepository);
    await userRepository.deleteAll({role: {neq: UserRole.Admin}});
    await userRepository.deleteAll({email: 'admin2@test.com'});
    await app.stop();
  });

  describe('Create new user', () => {
    it('creates a new user', async () => {
      const user = givenUser();
      const response = await client
        .post('/users/sign-up')
        .send(user)
        .expect(200);
      // match email and role is user
      expect(response.body.email).to.eql(user.email);
      expect(response.body.role).to.eql(UserRole.User);
    });

    it('login with new user', async () => {
      const user = givenUser();
      const response = await client.post('/users/login').send(user).expect(200);
      // expect accessToken and refreshToken to be defined
      expect(response.body.accessToken).to.be.String();
      expect(response.body.refreshToken).to.be.String();
    });
  });

  describe('Create new agency', () => {
    it('creates a new user with role agency by admin', async () => {
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
      // match email and role is agency
      expect(response.body.email).to.eql(agency.email);
      expect(response.body.role).to.eql(UserRole.Agency);
    });
  });

  describe('Create new admin', () => {
    it('creates a new user with role admin by admin', async () => {
      const admin = givenAdmin();
      const newAdmin = givenAdminUser();
      // login with admin role
      const loginResponse = await client
        .post('/users/login')
        .send({email: admin.email, password: admin.password})
        .expect(200);
      const token = loginResponse.body.accessToken;
      const response = await client
        .post('/users/sign-up/admin')
        .set('Authorization', `Bearer ${token}`)
        .send(newAdmin)
        .expect(200);
      // match email and role is admin
      expect(response.body.email).to.eql(newAdmin.email);
      expect(response.body.role).to.eql(UserRole.Admin);
    });
  });
});
