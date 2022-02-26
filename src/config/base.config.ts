import { registerAs } from '@nestjs/config';

export default registerAs('base', () => ({
  nodeEnv: process.env.NODE_ENV || 'DEV',
  port: process.env.PORT || 5000,
  selfURL: process.env.SELF_URL || 'http://localhost:5000',
  adminURL: process.env.ADMIN_URL || 'http://localhost:3000',
}));
