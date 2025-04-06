import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export const ValidateHeaders = (dtoClass: any) =>
    createParamDecorator(async (_, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const headers = request.headers;

        // Convert headers to DTO instance
        const dtoInstance = plainToInstance(dtoClass, headers, { enableImplicitConversion: true });

        // Validate DTO
        let errors: any = await validate(dtoInstance);
        
        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
     
        return dtoInstance;
    })();
