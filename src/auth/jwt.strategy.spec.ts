import { Test, TestingModule } from '@nestjs/testing';

import { UserRepo } from '../user/user.repository';
import { DocumentNotFoundException } from '../common/exceptions/document-not-found.exception';
import { JwtStrategy } from './jwt.strategy';
import jwtConfig from '../config/jwt.config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let repo: UserRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserRepo,
          useValue: {
            findById: jest.fn(() => {
              throw new DocumentNotFoundException('user');
            }),
          },
        },
        {
          provide: jwtConfig.KEY,
          useValue: {
            ignoreExpiration: true,
            secret: 'topsecret',
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    repo = module.get<UserRepo>(UserRepo);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate user', async () => {
    const id = 'id';
    const name = 'Yoda';
    (repo.findById as jest.Mock).mockReturnValue({ name, id });

    const user = await strategy.validate({ id });
    expect(user).toBeDefined();
    expect(user.name).toBe(name);
  });

  it('should not validate user', () => {
    const id = 'id';

    expect(strategy.validate({ id })).rejects.toThrow();
  });
});
