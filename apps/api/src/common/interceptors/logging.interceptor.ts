import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { writeStructuredLog } from '../structured-log';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () =>
          writeStructuredLog('log', {
            method: request.method,
            path: request.path,
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
          }),
        error: (error: unknown) =>
          writeStructuredLog('error', {
            method: request.method,
            path: request.path,
            statusCode:
              typeof error === 'object' &&
              error !== null &&
              'getStatus' in error &&
              typeof error.getStatus === 'function'
                ? error.getStatus()
                : 500,
            durationMs: Date.now() - startedAt,
          }),
      }),
    );
  }
}
