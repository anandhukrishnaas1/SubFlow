import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { getRequestContext } from '../request-context';
import { writeStructuredLog } from '../structured-log';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || res;
    }

    const context = getRequestContext();
    writeStructuredLog(status >= 500 ? 'error' : 'warn', {
      method: request.method,
      path: request.path,
      statusCode: status,
      error:
        exception instanceof Error
          ? exception.stack || exception.message
          : String(exception),
    });
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.path,
      requestId: context?.requestId,
      correlationId: context?.correlationId,
      error: status >= 500 ? 'Internal server error' : message,
    });
  }
}
