import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { IS_EXCLUDED_FROM_RESPONSE_INTERCEPTOR } from 'src/common/decorators/exclude-interceptor/exclude-interceptor.decorator';
import { LoggerService } from 'src/common/services/logger/logger.service';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(
      private readonly logger: LoggerService,
      private readonly reflector: Reflector,
  ) { }
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {

      const ctx = context.switchToHttp();
      const handler = context.getHandler();

      // Check if the handler has the ExcludeInterceptor metadata
      const excludeInterceptor = this.reflector.get<boolean>(IS_EXCLUDED_FROM_RESPONSE_INTERCEPTOR, handler);

      // Skip the interceptor if the metadata is present
      if (excludeInterceptor) {
          return next.handle(); // Skip transformation for this route
      }

      return next.handle().pipe(
          map((res: unknown) => this.responseHandler(res, context)),
          catchError((err: HttpException) =>
              throwError(() => {
                  throw err;
              }),
          ),
      );
  }

  responseHandler(res: any, context: ExecutionContext) {
      const ctx = context.switchToHttp();
      const response = ctx.getResponse();

      const statusCode = response.statusCode;

      return {
          code: statusCode,
          success: true,
          message: res.message,
          error: false,
          errorMessage: null,
          result: res.data,
      };
  }
}
