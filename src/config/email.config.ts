import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  disableEmailModule: process.env.DISABLE_EMAIL_MODULE === 'true',
  exposeTemplateEndpoint: process.env.EXPOSE_TEMPLATE_ENDPOINT === 'true',
  sender: process.env.EMAIL_SENDER || 'SENDGRID',
  sgKey: process.env.SG_KEY,
  sgFrom: process.env.SG_FROM || 'no-reply@ezdumptruck.com',
}));
