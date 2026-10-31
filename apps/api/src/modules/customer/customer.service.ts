import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';
import { UserRole } from '@subflow/shared';

@Injectable()
export class CustomerService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private get collection() {
    return this.firebase.getFirestore().collection('users');
  }

  async findAll(query?: { search?: string; status?: string }): Promise<any[]> {
    let q = this.collection.where('role', '==', UserRole.CUSTOMER);

    if (query?.status) {
      q = q.where('status', '==', query.status);
    }

    const snapshot = await q.get();
    let customers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (query?.search) {
      const term = query.search.toLowerCase();
      customers = customers.filter(
        (c: any) =>
          c.displayName?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.company?.toLowerCase().includes(term),
      );
    }

    return customers;
  }

  async findOne(id: string): Promise<any> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() };
  }

  async create(dto: any, performedBy: string): Promise<any> {
    const docRef = this.collection.doc();
    const now = new Date().toISOString();

    const customerData = {
      id: docRef.id,
      uid: docRef.id,
      email: dto.email,
      displayName: dto.displayName || dto.name,
      company: dto.company || '',
      phone: dto.phone || '',
      address: dto.address || '',
      city: dto.city || '',
      state: dto.state || '',
      country: dto.country || '',
      zipCode: dto.zipCode || '',
      notes: dto.notes || '',
      role: UserRole.CUSTOMER,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: performedBy,
    };

    await docRef.set(customerData);

    this.eventEmitter.emit(EVENTS.CUSTOMER_CREATED, {
      customerId: docRef.id,
      customerName: customerData.displayName,
      email: customerData.email,
    });

    return customerData;
  }

  async update(id: string, dto: any): Promise<any> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const updateData = {
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    delete updateData.id;
    delete updateData.uid;

    await ref.update(updateData);

    this.eventEmitter.emit(EVENTS.CUSTOMER_UPDATED, {
      customerId: id,
      ...updateData,
    });

    return { id, ...(doc.data() as any), ...updateData };
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Soft delete
    await ref.update({
      status: 'inactive',
      deletedAt: new Date().toISOString(),
    });

    return { success: true };
  }
}
