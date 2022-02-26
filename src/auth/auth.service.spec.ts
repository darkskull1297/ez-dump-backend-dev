import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { UserRepo } from '../user/user.repository';
import { EmailService } from '../email/email.service';
import baseConfig from '../config/base.config';
import { UserRole, User } from '../user/user.model';
import { DocumentNotFoundException } from '../common/exceptions/document-not-found.exception';
import { InvalidCredentialsException } from './exceptions/invalid-credentials.exception';
import { WrongRoleException } from './exceptions/wrong-role.exception';
import { EmailNotVerifiedException } from './exceptions/email-not-verified.exception';
import { AlreadyVerifiedException } from './exceptions/already-verified.exception';
import { Company } from '../company/company.model';
import { AlreadyExistsException } from '../common/exceptions/already-exists.exception';

describe('AuthService', () => {
  let service: AuthService;
  let repo: UserRepo;
  let emailService: EmailService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(() => ''),
            verifyAsync: jest.fn(() => ({})),
          },
        },
        {
          provide: UserRepo,
          useValue: {
            findOne: jest.fn(() => {
              throw new DocumentNotFoundException('user');
            }),
            create: jest.fn(x => x),
            save: jest.fn(x => x),
            comparePassword: jest.fn(() => true),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmailVerification: jest.fn(),
            sendDriverCreds: jest.fn(),
          },
        },
        { provide: baseConfig.KEY, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repo = module.get<UserRepo>(UserRepo);
    emailService = module.get<EmailService>(EmailService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register correctly', async () => {
    const name = 'name';
    const email = 'email@gmail.com';
    const phone = '+59899123456';
    const password = 'password';
    const role = UserRole.CONTRACTOR;

    const token = await service.register(name, email, phone, password, role);
    expect(repo.create).toBeCalled();
    expect(emailService.sendEmailVerification).toBeCalled();
    expect(jwtService.signAsync).toBeCalled();
    expect(token).toBeDefined();
  });

  it('should throw already exists on register', async () => {
    const name = 'name';
    const email = 'email@gmail.com';
    const phone = '+59899123456';
    const password = 'password';
    const role = UserRole.CONTRACTOR;

    await service.register(name, email, phone, password, role);
    (repo.findOne as jest.Mock).mockReturnValue({});
    expect(
      service.register(name, email, phone, password, role),
    ).rejects.toThrowError(AlreadyExistsException);
  });

  it('should login correctly', async () => {
    const email = 'email@gmail.com';
    const password = 'password';
    const role = UserRole.CONTRACTOR;

    const user = { email, password, role, verifiedEmail: true } as User;
    (repo.findOne as jest.Mock).mockReturnValue(user);

    const token = await service.login(email, password, role);
    expect(token).toBeDefined();
    expect(repo.comparePassword).toBeCalled();
    expect(jwtService.signAsync).toBeCalled();
  });

  it('should throw invalid credentials on login', async () => {
    const email = 'email@gmail.com';
    const password = 'password';
    const role = UserRole.CONTRACTOR;

    const user = { email, password, role, verifiedEmail: true } as User;
    (repo.findOne as jest.Mock).mockReturnValue(user);
    (repo.comparePassword as jest.Mock).mockReturnValue(false);

    expect(service.login(email, password, role)).rejects.toThrowError(
      InvalidCredentialsException,
    );
  });

  it('should throw invalid credentials on login with non existing user', async () => {
    const email = 'email@gmail.com';
    const password = 'password';
    const role = UserRole.CONTRACTOR;

    (repo.findOne as jest.Mock).mockRejectedValue(
      new DocumentNotFoundException('user'),
    );

    expect(service.login(email, password, role)).rejects.toThrowError(
      InvalidCredentialsException,
    );
  });

  it('should throw invalid role on login', async () => {
    const email = 'email@gmail.com';
    const password = 'password';
    const role = UserRole.CONTRACTOR;

    const user = { email, password, role, verifiedEmail: true } as User;
    (repo.findOne as jest.Mock).mockReturnValue(user);

    expect(
      service.login(email, password, UserRole.DRIVER),
    ).rejects.toThrowError(WrongRoleException);
  });

  it('should throw email not verified on login', async () => {
    const email = 'email@gmail.com';
    const password = 'password';
    const role = UserRole.CONTRACTOR;

    const user = { email, password, role, verifiedEmail: false } as User;
    (repo.findOne as jest.Mock).mockReturnValue(user);

    expect(service.login(email, password, role)).rejects.toThrowError(
      EmailNotVerifiedException,
    );
  });

  it('should verify email correctly', async () => {
    const email = 'mail@gmail.com';
    const role = UserRole.OWNER;
    (jwtService.verifyAsync as jest.Mock).mockReturnValue({ email, role });

    const user = { email, role } as User;
    (repo.findOne as jest.Mock).mockReturnValue(user);

    const token = await service.verifyEmail('', role);
    expect(token).toBeDefined();
    expect(repo.save).toBeCalled();
    expect(jwtService.signAsync).toBeCalled();
  });

  it('should throw wrong role on verify email', async () => {
    const email = 'mail@gmail.com';
    const role = UserRole.OWNER;
    (jwtService.verifyAsync as jest.Mock).mockReturnValue({
      email,
      role: UserRole.DRIVER,
    });

    const user = { email, role } as User;
    (repo.findOne as jest.Mock).mockReturnValue(user);

    expect(service.verifyEmail('', role)).rejects.toThrowError(
      WrongRoleException,
    );
  });

  it('should throw document not found on verify email', async () => {
    const email = 'mail@gmail.com';
    const role = UserRole.OWNER;
    (jwtService.verifyAsync as jest.Mock).mockReturnValue({
      email,
      role,
    });

    (repo.findOne as jest.Mock).mockRejectedValue(
      new DocumentNotFoundException('user'),
    );

    expect(service.verifyEmail('', role)).rejects.toThrowError(
      DocumentNotFoundException,
    );
  });

  it('should resend verification correctly', async () => {
    const email = 'mail@gmail.com';
    const role = UserRole.DRIVER;

    const user = { email, role, verifiedEmail: false } as User;
    (repo.findOne as jest.Mock).mockReturnValue(user);

    const message = await service.resendVerification(email);
    expect(message).toBeDefined();
    expect(emailService.sendEmailVerification).toBeCalled();
    expect(jwtService.signAsync).toBeCalled();
  });

  it('should throw already verified on resend verification', async () => {
    const email = 'mail@gmail.com';
    const role = UserRole.DRIVER;

    const user = { email, role, verifiedEmail: true } as User;
    (repo.findOne as jest.Mock).mockReturnValue(user);

    expect(service.resendVerification(email)).rejects.toThrowError(
      AlreadyVerifiedException,
    );
  });

  it('should throw document not found on resend verification', async () => {
    const email = 'mail@gmail.com';
    const role = UserRole.DRIVER;

    const user = { email, role, verifiedEmail: true } as User;
    (repo.findOne as jest.Mock).mockReturnValue(user);

    expect(service.resendVerification(email)).rejects.toThrowError(
      AlreadyVerifiedException,
    );
  });

  it('should register driver correctly', async () => {
    const name = 'name';
    const email = 'email@gmail.com';
    const phone = '+59899123456';
    const owner = { company: new Company() } as User;

    const registered = await service.registerDriver(name, email, phone, owner);
    expect(repo.create).toBeCalled();
    expect(emailService.sendDriverCreds).toBeCalled();
    expect(registered).toBeTruthy();
  });

  it('should throw already exists on driver correctly', async () => {
    const name = 'name';
    const email = 'email@gmail.com';
    const phone = '+59899123456';
    const owner = { company: new Company() } as User;

    (repo.findOne as jest.Mock).mockReturnValue({});

    expect(
      service.registerDriver(name, email, phone, owner),
    ).rejects.toThrowError(AlreadyExistsException);
  });

  it('should set as admin correctly', async () => {
    const email = 'mail@gmail.com';
    const role = UserRole.DRIVER;

    const user = { email, role, verifiedEmail: false } as User;
    (repo.findOne as jest.Mock).mockReturnValue(user);

    await service.setAsAdmin(email);
    expect(user.role).toBe(UserRole.ADMIN);
    expect(user.verifiedEmail).toBe(true);
    expect(user.readonly).toBe(false);
    expect(repo.save).toBeCalled();
  });

  it('should set as support correctly', async () => {
    const email = 'mail@gmail.com';
    const role = UserRole.DRIVER;

    const user = { email, role, verifiedEmail: false } as User;
    (repo.findOne as jest.Mock).mockReturnValue(user);

    await service.setAsSupport(email);
    expect(user.role).toBe(UserRole.ADMIN);
    expect(user.verifiedEmail).toBe(true);
    expect(user.readonly).toBe(true);
    expect(repo.save).toBeCalled();
  });

  it('should change password correctly', async () => {
    const email = 'mail@gmail.com';
    const role = UserRole.DRIVER;
    const newPass = 'newPass';

    const user = { email, role, verifiedEmail: false, password: '123' } as User;

    await service.changePassword(user, newPass);
    expect(repo.save).toBeCalled();
    expect(user.password).not.toBe(newPass);
  });
});
