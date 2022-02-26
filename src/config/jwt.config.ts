import { registerAs } from "@nestjs/config";

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'Not A Safe Secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  ignoreExpiration: process.env.JWT_IGNORE_EXPIRATION === 'true',
}));