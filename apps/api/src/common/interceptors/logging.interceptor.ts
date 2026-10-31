import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { writeApplicationLog } from '../structured-log';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const startedAt = Date.now();
    const moduleName = context.getClass().name;
    const operation = context.getHandler().name;
    const path = request.route?.path || request.path || '/';
    const logRequest = (
      status: string,
      errorCode?: string,
      statusCode = response.statusCode,
    ) =>
      writeApplicationLog({
        level: status === 'error' ? 'error' : 'info',
        action: 'http.request',
        module: moduleName,
        operation,
        durationMs: Date.now() - startedAt,
        httpMethod: request.method,
        path,
        status: `${status}:${statusCode}`,
        errorCode,
        message: status === 'error' ? 'Request failed' : 'Request completed',
      });

    return next.handle().pipe(
      tap({
        complete: () => logRequest('success'),
        error: (error: unknown) => {
          const status =
            error instanceof HttpException ? error.getStatus() : 500;
          logRequest('error', `HTTP_${status}`, status);
        },
      }),
    );
  }
}
