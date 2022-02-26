import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import baseConfig from './base.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import templateConfig from './template.config';
import emailConfig from './email.config';
import awsConfig from './aws.config';
import stripeConfig from './stripe.config';
import twilioConfig from './twilio.config';

import Joi = require('@hapi/joi');

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [
        baseConfig,
        databaseConfig,
        jwtConfig,
        templateConfig,
        emailConfig,
        awsConfig,
        stripeConfig,
        twilioConfig,
      ],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().allow('DEV', 'TEST', 'PROD'),
        PORT: Joi.number().positive(),
        DB_HOST: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string(),
        DB_DATABASE: Joi.string().required(),
        JWT_SECRET: Joi.string(),
        JWT_EXPIRES_IN: Joi.string(),
        JWT_IGNORE_EXPIRATION: Joi.boolean(),
        TEMPLATE_FOLDER_DIR: Joi.string(),
        DISABLE_EMAIL_MODULE: Joi.boolean(),
        EXPOSE_TEMPLATE_ENDPOINT: Joi.boolean(),
        EMAIL_SENDER: Joi.string(),
        SG_KEY: Joi.string()
          .when('DISABLE_EMAIL_MODULE', {
            is: Joi.boolean().truthy(),
            then: Joi.optional(),
            otherwise: Joi.required(),
          })
          .error(
            new Error(
              'Config validation error: "SG_KEY" is required. Either provide a Sengrid Key or set "DISABLE_EMAIL_MODULE" to true.',
            ),
          ),
        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        S3_REGION: Joi.string().required(),
        S3_BUCKET_NAME: Joi.string().required(),
        STRIPE_SECRET_KEY: Joi.string().required(),
        STRIPE_WEBHOOK_SIGNING_SECRET: Joi.string().required(),
        STRIPE_ACCOUNT_RETURN_URL: Joi.string().required(),
        STRIPE_ACCOUNT_REFRESH_URL: Joi.string().required(),
        TWILIO_ACCOUNT_SID: Joi.string().required(),
        TWILIO_AUTH_TOKEN: Joi.string().required(),
      }),
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
