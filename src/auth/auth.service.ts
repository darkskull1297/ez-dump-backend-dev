import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { InjectEventEmitter } from 'nest-emitter';
import bcrypt from 'bcrypt';
import {
  NewContractor,
  NewDispatcher,
  NewForeman,
  NewDriver,
  NewOwner,
} from '../notification/notifications/notifications';
import { NotificationService } from '../notification/notification.service';
import { NotificationEventEmitter } from '../notification/notification.events';
import { UserRepo } from '../user/user.repository';
import { AlreadyExistsException } from '../common/exceptions/already-exists.exception';
import { InvalidCredentialsException } from './exceptions/invalid-credentials.exception';
import { DocumentNotFoundException } from '../common/exceptions/document-not-found.exception';
import { EmailService } from '../email/email.service';
import baseConfig from '../config/base.config';
import { InvalidVerifyEmailTokenException } from './exceptions/invalid-verify-email-token.exception';
import { EmailNotVerifiedException } from './exceptions/email-not-verified.exception';
import { AlreadyVerifiedException } from './exceptions/already-verified.exception';
import { UserRole, User } from '../user/user.model';
import { WrongRoleException } from './exceptions/wrong-role.exception';
import { generatePassword } from './password';
import { Owner } from '../user/owner.model';
import { Admin } from '../user/admin.model';
import { Contractor } from '../user/contractor.model';
import { Driver } from '../user/driver.model';
import { AuthEventEmitter } from './auth.events';
import { EmailNotExistsException } from './exceptions/email-not-exists.exception';
import { Dispatcher } from '../user/dispatcher.model';
import { Foreman } from '../user/foreman.model';
import { InvalidOldPasswordException } from './exceptions/invalid-old-password';
import { PhoneNumberInUseException } from './exceptions/phone-number-in-use.exception';
import { DeviceAlreadyLoggedException } from './exceptions/device-already-logged.exception';
import { DisabledUserException } from './exceptions/disabled-user-exception';
import {
  DriverNewAccount,
  NewContractorMessage,
  NewDispatcherMessage,
  NewDriverMessage,
  ForgotPasswordMessage,
  NewForemanMessage,
  NewJobNearAreaOwner,
} from '../notification/notifications/messages';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepo,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
    @Inject(baseConfig.KEY)
    private readonly baseConf: ConfigType<typeof baseConfig>,
    @InjectEventEmitter()
    private readonly eventEmitterNotification: NotificationEventEmitter,
    @InjectEventEmitter()
    private readonly eventEmitter: AuthEventEmitter,
    @InjectEventEmitter()
    private readonly eventEmitterMessage: NotificationEventEmitter,
  ) {}

  async registerOwner(
    user: Omit<Owner, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<boolean> {
    const { email, phoneNumber } = user;
    try {
      if (email) {
        await this.userRepository.findOne({
          email,
          role: UserRole.OWNER,
          isDisable: false,
        });
        throw new AlreadyExistsException('User', 'email', email);
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }
    try {
      if (phoneNumber) {
        await this.userRepository.findOne({
          phoneNumber,
          role: UserRole.OWNER,
          isDisable: false,
        });
        throw new PhoneNumberInUseException();
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }

    const owner = await this.userRepository.createOwner(
      user,
      await user.company,
    );
    this.emailService.sendEmailVerificationOwner(
      email,
      await this.getEmailVerificationURL(email, UserRole.OWNER),
      true,
    );
    const company = await user.company;
    this.eventEmitter.emit('ownerRegistered', {
      ownerId: owner.id,
      ownerEmail: owner.email,
      ownerName: owner.name,
      companyName: company.companyCommon.name,
    });

    const admin = await this.userRepository.find({ role: UserRole.ADMIN });
    // eslint-disable-next-line guard-for-in
    for (const key in admin) {
      const element = admin[key];

      const notification = await this.notificationService.createNotification({
        ...NewOwner(company.companyCommon.name),
        userId: element.id,
      });

      this.eventEmitterMessage.emit('sendTextMessage', {
        to: element.phoneNumber,
        ...NewJobNearAreaOwner(
          'https://admin.ezdumptruck.com/jobs/filter/available',
        ),
      });

      this.eventEmitterNotification.emit(
        'sendSocketNotification',
        notification,
        element.id,
      );
    }

    return true;
  }

  async setOwnerStripeAccount(
    ownerId: string,
    stripeAccountId: string,
  ): Promise<void> {
    await this.userRepository.update(ownerId, { stripeAccountId });
  }

  async registerContractor(
    user: Omit<Contractor, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<boolean> {
    const { email, phoneNumber } = user;
    try {
      if (email) {
        await this.userRepository.findOne({ email, isDisable: false });
        throw new AlreadyExistsException('User', 'email', email);
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }
    try {
      if (phoneNumber) {
        await this.userRepository.findOne({
          phoneNumber,
          role: UserRole.CONTRACTOR,
          isDisable: false,
        });
        throw new PhoneNumberInUseException();
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }

    await this.userRepository.createContractor(user, user.company);

    this.emailService.sendEmailVerificationContractor(
      email,
      await this.getEmailVerificationURL(email, UserRole.CONTRACTOR),
      false,
    );

    const admin = await this.userRepository.find({ role: UserRole.ADMIN });
    // eslint-disable-next-line guard-for-in
    for (const key in admin) {
      const element = admin[key];

      const notification = await this.notificationService.createNotification({
        ...NewContractor(user.company.companyCommon.name),
        userId: element.id,
      });

      this.eventEmitterNotification.emit(
        'sendSocketNotification',
        notification,
        element.id,
      );

      this.eventEmitterMessage.emit('sendTextMessage', {
        to: element.phoneNumber,
        ...NewContractorMessage(user.company.companyCommon.name),
      });
    }

    return true;
  }

  async loginAsRole(
    email: string,
    role: UserRole,
    userAgent: string,
  ): Promise<string> {
    try {
      const existingUser = await this.userRepository.findOne({ email });
      if (existingUser.role !== role) {
        throw new WrongRoleException();
      }
      const { id, verifiedEmail } = existingUser;
      if (!verifiedEmail) {
        throw new EmailNotVerifiedException();
      }

      const token = await this.jwtService.signAsync({ id });
      this.userRepository.updateUserLoggedIn(existingUser.id, token, userAgent);

      return token;
    } catch (e) {
      if (e instanceof DocumentNotFoundException) {
        throw new InvalidCredentialsException();
      }
      throw e;
    }
  }

  async login(
    email: string,
    password: string,
    role: UserRole,
    userAgent: string,
  ): Promise<string> {
    try {
      const disabledUser = await this.userRepository.loginByDisabledUser(
        email,
        role,
      );
      const existingUser = await this.userRepository.loginByEmailOrPassword(
        email,
        role,
      );

      if (disabledUser && await this.userRepository.comparePassword(disabledUser, password)
        && !await this.userRepository.comparePassword(existingUser, password)) {
        throw new DisabledUserException();
      }
      if (
        !(await this.userRepository.comparePassword(existingUser, password))
      ) {
        throw new InvalidCredentialsException();
      }
      if (existingUser.role !== role && existingUser.role !== 'ADMIN') {
        throw new WrongRoleException();
      }
      const { id, verifiedEmail } = existingUser;
      if (!verifiedEmail) {
        throw new EmailNotVerifiedException();
      }
      if (existingUser.loggedToken && existingUser.role === UserRole.DRIVER) {
        throw new DeviceAlreadyLoggedException();
      }
      const token = await this.jwtService.signAsync({ id, date: new Date() });

      this.userRepository.updateUserLoggedIn(existingUser.id, token, userAgent);

      return token;
    } catch (e) {
      if (e instanceof DocumentNotFoundException) {
        throw new InvalidCredentialsException();
      }
      throw e;
    }
  }

  async validateUser(token: string): Promise<void> {
    const user = await this.userRepository.findOne({ loggedToken: token });
    if (!user) throw new UnauthorizedException();
  }

  async getEmailVerificationURL(
    email: string,
    role: UserRole,
  ): Promise<string> {
    return `${
      this.baseConf.selfURL
    }/${role}/auth/verify-email/${await this.jwtService.signAsync(
      { email, role },
      { expiresIn: '1d' },
    )}`;
  }

  getAdminUrl(): string {
    return this.baseConf.adminURL;
  }

  async verifyEmail(token: string, role: UserRole): Promise<string> {
    try {
      const { email, role: userRole } = await this.jwtService.verifyAsync(
        token,
      );
      if (userRole !== role) {
        throw new WrongRoleException();
      }
      const user = await this.userRepository.findOne({
        email,
        isDisable: false,
      });
      user.verifiedEmail = true;
      await this.userRepository.save(user);
      return this.jwtService.signAsync({ id: user.id, role, name: user.name });
    } catch (e) {
      if (
        e instanceof WrongRoleException ||
        e instanceof DocumentNotFoundException
      )
        throw e;
      throw new InvalidVerifyEmailTokenException();
    }
  }

  async resendVerification(email: string): Promise<string> {
    try {
      const user = await this.userRepository.findOne({
        email,
        isDisable: false,
      });
      if (user.verifiedEmail) {
        throw new AlreadyVerifiedException();
      }
      await this.emailService.sendEmailVerificationContractor(
        email,
        await this.getEmailVerificationURL(email, user.role),
        user.role === UserRole.OWNER,
      );
      return `A verification email was sent to ${email}`;
    } catch (e) {
      if (e instanceof DocumentNotFoundException) {
        return `A verification email was sent to ${email}`;
      }
      throw e;
    }
  }

  async registerDriver(
    driver: Omit<Driver, 'id' | 'updatedAt' | 'createdAt' | 'password'>,
    owner: Owner,
  ): Promise<boolean> {
    const { email, phoneNumber, name } = driver;
    try {
      if (email) {
        await this.userRepository.findOne({
          email,
          role: UserRole.DRIVER,
          isDisable: false,
        });
        throw new AlreadyExistsException('User', 'email', email);
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }
    try {
      if (phoneNumber) {
        await this.userRepository.findOne({
          phoneNumber,
          role: UserRole.DRIVER,
          isDisable: false,
        });
        throw new PhoneNumberInUseException();
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }

    const isRestricted = owner.isRestricted;
    driver.isDisable = owner.isDisable;
    driver.isRestricted = isRestricted;
    driver.restrictedAt = isRestricted ? new Date() : null;
    const password = generatePassword();
    await this.userRepository.createDriver({ ...driver, password }, owner.id);
    try {
      await this.emailService.sendDriverCreds(
        name,
        email,
        password,
        owner.name,
        this.baseConf.adminURL,
      );

      this.eventEmitterMessage.emit('sendTextMessage', {
        to: driver.phoneNumber,
        ...DriverNewAccount(email, password, driver.phoneNumber),
      });

      const admin = await this.userRepository.find({ role: UserRole.ADMIN });
      // eslint-disable-next-line guard-for-in
      for (const key in admin) {
        const element = admin[key];

        const notification = await this.notificationService.createNotification({
          ...NewDriver(),
          userId: element.id,
        });

        this.eventEmitterNotification.emit(
          'sendSocketNotification',
          notification,
          element.id,
        );

        this.eventEmitterMessage.emit('sendTextMessage', {
          to: element.phoneNumber,
          ...NewDriverMessage(driver.name),
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('error', error.message);
    }
    return true;
  }

  async registerDispatcher(
    dispatcher: Omit<Dispatcher, 'id' | 'updatedAt' | 'createdAt' | 'password'>,
    owner: Owner,
  ): Promise<boolean> {
    const { email, phoneNumber, name } = dispatcher;
    try {
      if (email) {
        await this.userRepository.findOne({
          email,
          role: UserRole.DISPATCHER,
          isDisable: false,
        });
        throw new AlreadyExistsException('User', 'email', email);
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }
    try {
      if (phoneNumber) {
        await this.userRepository.findOne({
          phoneNumber,
          role: UserRole.DISPATCHER,
          isDisable: false,
        });
        throw new PhoneNumberInUseException();
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }

    const isRestricted = owner.isRestricted;
    dispatcher.isDisable = owner.isDisable;
    dispatcher.isRestricted = isRestricted;
    dispatcher.restrictedAt = isRestricted ? new Date() : null;
    const password = generatePassword();
    const dispatcherUser = await this.userRepository.createDispatcher(
      { ...dispatcher, password },
      owner.id,
    );
    await this.emailService.sendDispatcherCreds(
      name,
      email,
      password,
      owner.name,
      this.baseConf.adminURL,
    );

    const admin = await this.userRepository.find({ role: UserRole.ADMIN });
    // eslint-disable-next-line guard-for-in
    for (const key in admin) {
      const element = admin[key];

      const notification = await this.notificationService.createNotification({
        ...NewDispatcher(
          dispatcherUser.name,
          (await owner.company).companyCommon.name,
        ),
        userId: element.id,
      });

      this.eventEmitterNotification.emit(
        'sendSocketNotification',
        notification,
        element.id,
      );
      this.eventEmitterMessage.emit('sendTextMessage', {
        to: element.phoneNumber,
        ...NewDispatcherMessage(dispatcherUser.name),
      });
    }
    return true;
  }

  async registerForeman(
    foreman: Omit<Foreman, 'id' | 'updatedAt' | 'createdAt' | 'password'>,
    owner: Owner,
  ): Promise<boolean> {
    const { email, phoneNumber, name } = foreman;
    try {
      if (email) {
        await this.userRepository.findOne({
          email,
          role: UserRole.FOREMAN,
          isDisable: false,
        });
        throw new AlreadyExistsException('User', 'email', email);
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }
    try {
      if (phoneNumber) {
        await this.userRepository.findOne({
          phoneNumber,
          role: UserRole.FOREMAN,
          isDisable: false,
        });
        throw new PhoneNumberInUseException();
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }

    const isRestricted = owner.isRestricted;
    foreman.isDisable = owner.isDisable;
    foreman.isRestricted = isRestricted;
    foreman.restrictedAt = isRestricted ? new Date() : null;
    const password = generatePassword();
    await this.userRepository.createForeman({ ...foreman, password }, owner.id);
    await this.emailService.sendForemanCreds(
      name,
      email,
      password,
      owner.name,
      this.baseConf.adminURL,
    );

    const admin = await this.userRepository.find({ role: UserRole.ADMIN });
    // eslint-disable-next-line guard-for-in

    // eslint-disable-next-line guard-for-in
    for (const key in admin) {
      const element = admin[key];
      const notification = await this.notificationService.createNotification({
        ...NewForeman(name, (await owner.company).companyCommon.name),
        userId: element.id,
      });

      this.eventEmitterMessage.emit('sendTextMessage', {
        to: element.phoneNumber,
        ...NewForemanMessage(foreman.name),
      });

      this.eventEmitterNotification.emit(
        'sendSocketNotification',
        notification,
        element.id,
      );
    }

    return true;
  }

  async setAsAdmin(email: string): Promise<boolean> {
    const user = (await this.userRepository.findOne({
      email,
      role: UserRole.ADMIN,
      isDisable: false,
    })) as Admin;
    user.readonly = false;
    await this.userRepository.save(user);
    return true;
  }

  async setAsSupport(email: string): Promise<boolean> {
    const user = (await this.userRepository.findOne({
      email,
      role: UserRole.ADMIN,
      isDisable: false,
    })) as Admin;
    user.readonly = true;
    await this.userRepository.save(user);
    return true;
  }

  async changePassword(
    user: User,
    oldPassword: string,
    newPassword: string,
  ): Promise<string> {
    if (!(await this.userRepository.comparePassword(user, oldPassword))) {
      throw new InvalidOldPasswordException();
    }
    const { id } = user;
    user.password = await bcrypt.hash(newPassword, 12);

    const token = await this.jwtService.signAsync({ id, date: new Date() });

    user.loggedToken = token;

    await this.userRepository.save(user);

    return token;
  }

  async getEmailForgotPasswordURL(
    email: string,
    role: UserRole,
  ): Promise<string> {
    return `${
      this.baseConf.adminURL
    }/reset-password?token=${await this.jwtService.signAsync(
      { email, role },
      { expiresIn: '1h' },
    )}`;
  }

  async forgotPassword(
    email: string,
    role: UserRole,
    type?: string,
  ): Promise<string> {
    let user;

    if (role === UserRole.DRIVER) {
      user = await this.userRepository.loginByEmailOrPassword(email, role);
    } else {
      user = await this.userRepository.findOne({ email, isDisable: false });
    }

    if (!user) {
      throw new EmailNotExistsException();
    }

    if (user.role !== role) {
      throw new WrongRoleException();
    }

    if (type === 'app') {
      const newPassword = generatePassword();

      const findUser = await this.userRepository.findOne({
        email,
        isDisable: false,
      });
      findUser.password = await bcrypt.hash(newPassword, 12);
      await this.userRepository.save(findUser);

      this.emailService.sendEmailWithNewPassword(
        email,
        findUser?.name,
        newPassword,
      );
    } else {
      if (user.email) {
        this.emailService.sendForgotPasswordEmail(
          user.email,
          await this.getEmailForgotPasswordURL(email, user.role),
        );
      }

      this.eventEmitterMessage.emit('sendTextMessage', {
        to: user.phoneNumber,
        ...ForgotPasswordMessage(
          await this.getEmailForgotPasswordURL(email, user.role),
        ),
      });
    }
    return `An email with a link to reset your password was sent to ${email}`;
  }

  async generatePassword(): Promise<string> {
    const length = 8;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let retVal = '';
    // eslint-disable-next-line no-plusplus
    for (let i = 0, n = charset.length; i < length; i++) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  }

  async resetPassword(token: string, newPassword: string): Promise<string> {
    const { email, role: userRole } = await this.jwtService.verifyAsync(token);
    const user = await this.userRepository.loginByEmailOrPassword(email, userRole);
    user.password = await bcrypt.hash(newPassword, 12);
    await this.userRepository.save(user);
    return this.jwtService.signAsync({
      id: user.id,
      role: userRole,
      name: user.name,
    });
  }

  async getUser(id: string): Promise<User> {
    return this.userRepository.findById(id);
  }
}
