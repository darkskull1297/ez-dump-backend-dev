import { User } from '../../user/user.model';

export interface Notification {
  user: User;
  title: string;
  content: string;
  submitted: Date;
  isChecked: boolean;
  priority: number;
}
