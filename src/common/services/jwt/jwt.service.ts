import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JsonWebTokenError, JwtService, TokenExpiredError } from "@nestjs/jwt";
import { Env } from "src/common/config/env.config";
import { ERROR } from "src/common/enums/response.enum";

@Injectable()
export class CustomJwtService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService
    ) {

    }

    /**
     * Verifies the provided JWT token asynchronously.
     *
     * @param {string} token - The JWT token to verify.
     * @returns {Promise<any>} - A promise that resolves with the decoded token if verification is successful.
     * @throws {UnauthorizedException} - Throws an UnauthorizedException with an appropriate message if the token is invalid, expired, or if any other error occurs during verification.
     */
    async verifyAsync(token: string) {
        try {
            const options = {
                secret: this.configService.get(Env.JWT_SECRET),
            }
            return await this.jwtService.verifyAsync(token, options);
        } catch (error) {
            let message = ERROR.ERROR_NO_TOKEN;
            if (error instanceof TokenExpiredError) {
                message = ERROR.ERROR_TOKEN_EXPIRED;
            } else if (error instanceof JsonWebTokenError) {
                message = ERROR.ERROR_INVALID_TOKEN;
            } else {
                message = error?.message || message;
            }
            throw new UnauthorizedException(message);
        }

    }

    /**
     * Asynchronously signs a payload to produce a JWT token.
     *
     * @param payload - The payload to sign, typically an object containing user information or claims.
     * @returns A promise that resolves to the signed JWT token.
     */
    sign(payload: any) {
        return this.jwtService.sign(payload, {
            secret: this.configService.get(Env.JWT_SECRET), // Secret should be set in module config, not here
            expiresIn: '12h' // Expiration time
        });
    }

     /**
     * Asynchronously signs a payload to produce a JWT token.
     *
     * @param payload - The payload to sign, typically an object containing user information or claims.
     * @returns A promise that resolves to the signed JWT token.
     */
     refreshSign(payload: any) {
        return this.jwtService.sign(payload, {
            secret: this.configService.get(Env.JWT_SECRET), // Secret should be set in module config, not here
            expiresIn: '30d' // Expiration time
        });
    }



}