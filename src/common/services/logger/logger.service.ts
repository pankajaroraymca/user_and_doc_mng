import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { loggerConfig } from './logger.config';
import { RequestContext } from 'src/common/utility/request-context';

@Injectable()
export class LoggerService {
    private logger: winston.Logger;

    constructor() {
        this.logger = winston.createLogger(loggerConfig);
    }

    private addUserToMetadata(metaData: Record<string, any>, user?: Record<string, any>) {
        
        return user ? { email: user.email, ...metaData } : metaData;
    }

    private getUserProfile() {
        return RequestContext.get('user');
    }

    log(message: string, metaData?: Record<string, any>) {
        const user = this.getUserProfile();    
        this.logger.info(message, this.addUserToMetadata(metaData, user));
    }

    error(message: string, metaData?: Record<string, any>) {
        const user = this.getUserProfile();
        this.logger.error(message, this.addUserToMetadata(metaData, user));
    }

    warn(message: string, metaData?: Record<string, any>) {
        const user = this.getUserProfile();
        this.logger.warn(message, this.addUserToMetadata(metaData, user))
    }

    debug(message: string) {
        this.logger.debug(message);
    }

    verbose(message: string) {
        this.logger.verbose(message);
    }
}
