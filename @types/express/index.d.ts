import { UserRole } from '../../src/user/user.model';

declare global {
  namespace Express {
    // Express decided they wanted to force a User interface,
    // making it impossible to dynamically extend the type in Request.user
    interface User {
      id: string;
      role: UserRole;
      readonly: boolean;
    }
  }
}
