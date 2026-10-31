import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { UserRole } from '@subflow/shared';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (this.mockAuthenticationEnabled() && request.headers['x-mock-role']) {
        const mockRole = String(request.headers['x-mock-role']);
        if (!Object.values(UserRole).includes(mockRole as UserRole)) {
          throw new UnauthorizedException('Invalid mock role');
        }
        request.user = this.createMockUser(request.headers, mockRole);
        return true;
      }
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    try {
      if (token === 'demo-admin-token' && this.mockAuthenticationEnabled()) {
        request.user = this.createMockUser({}, UserRole.ADMIN);
        return true;
      }
      const decodedToken = await this.firebaseService.getAuth().verifyIdToken(token);
      const role = decodedToken.role || UserRole.CUSTOMER;
      if (!Object.values(UserRole).includes(role as UserRole)) {
        throw new UnauthorizedException('Invalid user role');
      }
      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role,
        name: decodedToken.name || decodedToken.displayName,
      };
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Firebase token verification failed: ${message}`);
      throw new UnauthorizedException('Invalid or expired Firebase ID token');
    }
  }

  private mockAuthenticationEnabled(): boolean {
    return (
      process.env.NODE_ENV === 'development' &&
      process.env.SUBFLOW_ENABLE_MOCK_AUTH === 'true' &&
      this.firebaseService.isMockFirestore
    );
  }

  private createMockUser(headers: Record<string, unknown>, role: string) {
    return {
      uid: String(headers['x-mock-uid'] || 'demo-admin-uid'),
      email: String(headers['x-mock-email'] || 'admin@subflow.io'),
      role,
      name: String(headers['x-mock-name'] || 'Mock User'),
    };
  }
}
