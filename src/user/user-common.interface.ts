import { UserService } from './user.service';

export interface UserCommon {
  userService: UserService;

  new (userService: UserService): UserCommon;

  getUpdateProfileImageUrl(): Promise<string>;
}
