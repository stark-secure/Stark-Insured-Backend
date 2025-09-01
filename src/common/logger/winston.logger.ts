import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

export const winstonLoggerOptions = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonModuleUtilities.format.nestLike('StarkInsured', {
          prettyPrint: true,
        }),
      ),
      level: process.env.LOG_LEVEL || 'info',
    }),
    new winston.transports.File({
      filename: 'logs/app.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      level: process.env.LOG_LEVEL || 'info',
    }),
  ],
};
