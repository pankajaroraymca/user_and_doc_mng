import { format, transports } from 'winston';

export const loggerConfig = {
  transports: [
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
