// logging.interceptor.ts
import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContext } from 'src/common/utility/request-context';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const user = request.user; // Assuming user is attached to the request object

        // Wrap the call to next.handle() inside RequestContext.run() and return the Observable
        return new Observable((observer) => {
            RequestContext.run(() => {
                RequestContext.set('user', user); // Set the user in the request context
                next
                    .handle()
                    .subscribe({
                        next: (value) => observer.next(value),
                        error: (err) => observer.error(err),
                        complete: () => observer.complete(),
                    });
            });
        });
    }
}
