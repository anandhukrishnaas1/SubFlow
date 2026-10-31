import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow demo user header in local development if configured
      if (process.env.NODE_ENV !== 'production' && request.headers['x-mock-role']) {
        const mockRole = (request.headers['x-mock-role'] as string) || 'admin';
        const mockUid = (request.headers['x-mock-uid'] as string) || 'mock-admin-uid';
        request.user = {
          uid: mockUid,
          email: request.headers['x-mock-email'] || 'admin@subflow.io',
          role: mockRole,
          name: request.headers['x-mock-name'] || 'Mock Administrator',
        };
        return true;
      }
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split('Bearer ')[1].trim();

    try {
      const decodedToken = await this.firebaseService.getAuth().verifyIdToken(token);
      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: (decodedToken.role as string) || 'customer',
        name: decodedToken.name || decodedToken.displayName,
      };
      return true;
    } catch (error) {
      // In development, handle fallback for mock/demo token
      if (process.env.NODE_ENV !== 'production' && token === 'demo-admin-token') {
        request.user = {
          uid: 'demo-admin-uid',
          email: 'admin@subflow.io',
          role: 'admin',
          name: 'Demo Admin',
        };
        return true;
      }

      this.logger.warn(`Firebase token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired Firebase ID token');
    }
  }
}
