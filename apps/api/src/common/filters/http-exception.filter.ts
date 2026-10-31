import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { getRequestContext } from '../request-context';
import { writeApplicationLog } from '../structured-log';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';
    let validationDetails: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      const responseMessage =
        typeof res === 'string'
          ? res
          : typeof res === 'object' && res !== null && 'message' in res
            ? res.message
            : undefined;
      if (Array.isArray(responseMessage)) {
        validationDetails = responseMessage.map(String);
        message = 'Request validation failed';
      } else if (typeof responseMessage === 'string') {
        message = responseMessage;
      } else {
        message = this.safeMessage(status);
      }
    } else {
      message = this.safeMessage(status);
    }

    const requestContext = getRequestContext();
    const errorCode = this.errorCode(status);
    writeApplicationLog({
      level: status >= 500 ? 'error' : 'warn',
      action: 'http.exception',
      module: 'http',
      operation: request.method,
      path: request.path,
      httpMethod: request.method,
      status: String(status),
      errorCode,
      message: 'HTTP request failed',
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.path,
      error: status >= 500 ? 'Internal server error' : message,
      errorCode,
      requestId: requestContext?.requestId,
      ...(validationDetails ? { details: validationDetails } : {}),
    });
  }

  private errorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return status >= 500 ? 'INTERNAL_ERROR' : `HTTP_${status}`;
    }
  }

  private safeMessage(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'The request is invalid.';
      case HttpStatus.UNAUTHORIZED:
        return 'Authentication is required.';
      case HttpStatus.FORBIDDEN:
        return 'You are not allowed to perform this action.';
      case HttpStatus.NOT_FOUND:
        return 'The requested resource was not found.';
      case HttpStatus.CONFLICT:
        return 'The request conflicts with the current resource state.';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Too many requests. Please try again later.';
      default:
        return 'Internal server error';
    }
  }
}
