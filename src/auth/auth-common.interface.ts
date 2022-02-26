import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';
import { User } from '../user/user.model';
import { ResendVerificationDTO } from './dto/resend-verification.dto';

export interface AuthCommon {
  authService: AuthService;

  new (authService: AuthService): AuthCommon;

  register(body: RegisterDTO): Promise<string>;

  login(body: LoginDTO): Promise<string>;

  me(user: User): Pick<User, 'id' | 'name' | 'email' | 'role'>;

  verifyEmail(token: string): Promise<string>;

  resendVerification(body: ResendVerificationDTO): Promise<string>;
}
