import {Injectable,NestInterceptor,ExecutionContext,CallHandler,BadRequestException,} from '@nestjs/common';
import { Observable } from 'rxjs';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ERROR as ResponseMessage } from 'src/common/enums/response.enum';


@Injectable()
export class QueryParamsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const queryParams = Object.keys(request.query); // Get all query params

    // Get the handler (method) and check if it has a DTO with query params
    const routeHandler = context.getHandler();
    const queryDto = Reflect.getMetadata('dto', routeHandler);

    // Case 1: If no DTO is defined, disallow all query parameters
    if (!queryDto && queryParams.length > 0) {
      throw new BadRequestException(
        ResponseMessage.ERROR_UNEXPECTED_ERROR_OCCURRED,
      );
    }

    // Case 2: If no query params are sent and no DTO is defined, allow the request to proceed
    if (!queryDto) {
      return next.handle();
    }

    // Convert the query params to the DTO class
    const dtoInstance = plainToClass(queryDto, request.query);
    const errors = validateSync(dtoInstance);

    if (errors.length > 0) {
      throw new BadRequestException(
        ResponseMessage.ERROR_UNEXPECTED_ERROR_OCCURRED,
      );
    }

    // Get allowed params from the DTO (only the keys defined in the DTO are allowed)
    const allowedParams = Object.keys(dtoInstance);

    // Check for any unexpected query parameters that are not in the DTO
    const unexpectedParams = queryParams.filter(
      (param) => !allowedParams.includes(param),
    );

    if (unexpectedParams.length > 0) {
      throw new BadRequestException(
        ResponseMessage.ERROR_UNEXPECTED_ERROR_OCCURRED,
      );
    }

    return next.handle();
  }
}
