import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';
import { UserRole } from '@subflow/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async setRole(uid: string, role: UserRole | string): Promise<{ success: boolean; uid: string; role: string }> {
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new BadRequestException('Invalid user role');
    }
    try {
      await this.firebase.getAuth().setCustomUserClaims(uid, { role });
      // Also update firestore user profile
      await this.firebase.getFirestore().collection('users').doc(uid).set(
        {
          role,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      this.logger.log(`Assigned role '${role}' to user: ${uid}`);
      return { success: true, uid, role };
    } catch {
      this.logger.error('Failed to update user role');
      throw new InternalServerErrorException('Unable to update user role');
    }
  }

  async createUser(dto: {
    email: string;
    password: string;
    displayName: string;
    role?: UserRole | string;
    company?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  }): Promise<any> {
    const role = dto.role || UserRole.CUSTOMER;
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new BadRequestException('Invalid user role');
    }
    if (!dto.password) {
      throw new BadRequestException('A password is required');
    }
    let createdUid: string | undefined;

    try {
      // 1. Create in Firebase Auth
      const userRecord = await this.firebase.getAuth().createUser({
        email: dto.email,
        password: dto.password,
        displayName: dto.displayName,
      });
      createdUid = userRecord.uid;

      // 2. Set Custom Claim
      await this.firebase.getAuth().setCustomUserClaims(userRecord.uid, { role });

      // 3. Create document in Firestore users collection
      const now = new Date().toISOString();
      const userData = {
        uid: userRecord.uid,
        email: dto.email,
        displayName: dto.displayName,
        role: role,
        company: dto.company || '',
        phone: dto.phone || '',
        address: dto.address || '',
        city: dto.city || '',
        state: dto.state || '',
        country: dto.country || '',
        zipCode: dto.zipCode || '',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      await this.firebase.getFirestore().collection('users').doc(userRecord.uid).set(userData);

      // 4. Emit event
      this.eventEmitter.emit(EVENTS.USER_CREATED, {
        uid: userRecord.uid,
        email: dto.email,
        displayName: dto.displayName,
        role,
      });

      if (role === UserRole.CUSTOMER) {
        this.eventEmitter.emit(EVENTS.CUSTOMER_CREATED, {
          customerId: userRecord.uid,
          customerName: dto.displayName,
          email: dto.email,
        });
      }

      return userData;
    } catch {
      if (createdUid) {
        try {
          await this.firebase.getAuth().deleteUser(createdUid);
        } catch {
          this.logger.error('Failed to remove incomplete Firebase account after registration failure');
        }
      }
      this.logger.error('Failed creating user account');
      throw new BadRequestException('Unable to create user account');
    }
  }

  async getProfile(uid: string): Promise<any> {
    const doc = await this.firebase.getFirestore().collection('users').doc(uid).get();
    if (!doc.exists) {
      // Create profile fallback from Firebase Auth
      try {
        const userRecord = await this.firebase.getAuth().getUser(uid);
        const fallback = {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName || userRecord.email?.split('@')[0],
          role: (userRecord.customClaims?.role as string) || 'customer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await this.firebase.getFirestore().collection('users').doc(uid).set(fallback, { merge: true });
        return fallback;
      } catch (error) {
        const code =
          typeof error === 'object' && error !== null && 'code' in error
            ? String(error.code)
            : '';
        if (code === 'auth/user-not-found') {
          throw new NotFoundException('User profile not found');
        }
        this.logger.error('Failed to load user profile');
        throw new InternalServerErrorException('Unable to load user profile');
      }
    }
    return doc.data();
  }
}
