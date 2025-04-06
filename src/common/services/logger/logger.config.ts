import { format, transports } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file'; // Use the correct import for version 4.x

const LOG_PATH = process.env.LOG_PATH || '/logs';

const logPath = `${process.cwd()}${LOG_PATH}`;

export const loggerConfig = {
  transports: [
    new DailyRotateFile({
      filename: `${logPath}/USER_AND_DOC_INFO-%DATE%.log`,
      zippedArchive: true,
      datePattern: 'YYYY-MM-DD',
      maxFiles: '5d',
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.printf(
          ({ timestamp, level, message, ...metadata }) => {

            let msg = `${timestamp} [${level}]: ${message}`

            if (Object.keys(metadata).length) {
              msg += ` | ${JSON.stringify(metadata)}`;
            }
            return msg;
          }
        ),
      ),
    }),
    new DailyRotateFile({
      filename: `${logPath}/USER_AND_DOC_ERROR-%DATE%.log`,
      zippedArchive: true,
      datePattern: 'YYYY-MM-DD',
      maxFiles: '5d',
      level: 'error',
      format: format.combine(
        format.timestamp(),
        format.printf(
          ({ timestamp, level, message }) =>
            `${timestamp} [${level}]: ${message}`,
        ),
      ),
    }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(
          ({ timestamp, level, message, ...metadata }) => {

            let msg = `${timestamp} [${level}]: ${message}`

            if (Object.keys(metadata).length) {
              msg += ` | ${JSON.stringify(metadata)}`;
            }
            return msg;
          }
        ),
      ),
    }),
  ],
};
