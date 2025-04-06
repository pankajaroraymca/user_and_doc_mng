import * as Joi from "joi";

export const envFilePath = `${process.cwd()}/env/.env.${process.env.NODE_ENV}`;

export enum Env {
  NODE_ENV = 'NODE_ENV',
  PORT = 'PORT',

  POSTGRES_HOST = 'POSTGRES_HOST',
  POSTGRES_PORT = 'POSTGRES_PORT',
  POSTGRES_USERNAME = 'POSTGRES_USERNAME',
  POSTGRES_DATABASE = 'POSTGRES_DATABASE',
  POSTGRES_PASSWORD = 'POSTGRES_PASSWORD',
  POSTGRES_SCHEMA = 'POSTGRES_SCHEMA',
  POSTGRES_SYNC = 'POSTGRES_SYNC',
  POSTGRES_SSL = 'POSTGRES_SSL',

  JWT_SECRET = 'JWT_SECRET',

  ALLOW_ORIGIN = 'ALLOW_ORIGIN',

  DS_BASE_URL = 'DS_BASE_URL'
}

export const validationSchema = Joi.object({
  [Env.NODE_ENV]: Joi.string().valid('dev', 'local', 'prod', 'uat'),

  [Env.PORT]: Joi.number().required(),

  [Env.ALLOW_ORIGIN]: Joi.string().required(),

  [Env.JWT_SECRET]: Joi.string().required(),

  [Env.POSTGRES_HOST]: Joi.string().required(),
  [Env.POSTGRES_PORT]: Joi.number().required(),
  [Env.POSTGRES_USERNAME]: Joi.string().required(),
  [Env.POSTGRES_DATABASE]: Joi.string().required(),
  [Env.POSTGRES_PASSWORD]: Joi.string().required(),
  [Env.POSTGRES_SCHEMA]: Joi.string().required(),
  [Env.POSTGRES_SYNC]: Joi.boolean().required(),
  [Env.POSTGRES_SSL]: Joi.boolean().required(),

  [Env.DS_BASE_URL]: Joi.string().required(),

});