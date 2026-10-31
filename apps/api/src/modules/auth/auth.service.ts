import { Injectable, BadRequestException, Logger } from '@nestjs/common';
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
    } catch (error) {
      throw new BadRequestException(`Failed to set user claims: ${error.message}`);
    }
  }

  async createUser(dto: {
    email: string;
    password?: string;
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
    const password = dto.password || 'SubFlow@2026!';

    try {
      // 1. Create in Firebase Auth
      const userRecord = await this.firebase.getAuth().createUser({
        email: dto.email,
        password: password,
        displayName: dto.displayName,
      });

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
    } catch (error) {
      this.logger.error(`Failed creating user: ${error.message}`);
      throw new BadRequestException(`Failed creating user: ${error.message}`);
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
      } catch {
        return null;
      }
    }
    return doc.data();
  }
}
