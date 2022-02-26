import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY,
  signingSecret: process.env.STRIPE_WEBHOOK_SIGNING_SECRET,
  returnUrl: process.env.STRIPE_ACCOUNT_RETURN_URL,
  refreshUrl: process.env.STRIPE_ACCOUNT_REFRESH_URL,
}));
