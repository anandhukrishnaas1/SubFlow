import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';

@Injectable()
export class PlanService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private get collection() {
    return this.firebase.getFirestore().collection('plans');
  }

  async findAll(status?: string): Promise<any[]> {
    let q: FirebaseFirestore.Query = this.collection;
    if (status) {
      q = q.where('status', '==', status);
    }
    const snap = await q.get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async findOne(id: string): Promise<any> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() };
  }

  async create(dto: any): Promise<any> {
    const docRef = this.collection.doc();
    const now = new Date().toISOString();

    // Denormalize linked products if productIds provided
    let denormalizedProducts: any[] = [];
    if (Array.isArray(dto.productIds) && dto.productIds.length > 0) {
      const prodSnaps = await Promise.all(
        dto.productIds.map((pid: string) =>
          this.firebase.getFirestore().collection('products').doc(pid).get(),
        ),
      );
      denormalizedProducts = prodSnaps
        .filter((s) => s.exists)
        .map((s) => ({
          id: s.id,
          name: s.data()?.name || '',
          price: s.data()?.salesPrice || 0,
        }));
    }

    const planData = {
      name: dto.name,
      description: dto.description || '',
      basePrice: Number(dto.basePrice) || 0,
      billingInterval: dto.billingInterval || 'monthly',
      minQuantity: Number(dto.minQuantity) || 1,
      availableFrom: dto.availableFrom || now,
      availableUntil: dto.availableUntil || null,
      autoClose: Boolean(dto.autoClose),
      allowCancel: dto.allowCancel !== undefined ? Boolean(dto.allowCancel) : true,
      allowPause: dto.allowPause !== undefined ? Boolean(dto.allowPause) : true,
      allowRenewal: dto.allowRenewal !== undefined ? Boolean(dto.allowRenewal) : true,
      status: dto.status || 'active',
      productIds: dto.productIds || [],
      products: denormalizedProducts,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(planData);

    this.eventEmitter.emit(EVENTS.PLAN_CREATED, {
      planId: docRef.id,
      planName: planData.name,
      basePrice: planData.basePrice,
      billingInterval: planData.billingInterval as any,
    });

    return { id: docRef.id, ...planData };
  }

  async update(id: string, dto: any): Promise<any> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    const updateData: any = {
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    delete updateData.id;

    if (dto.basePrice !== undefined) updateData.basePrice = Number(dto.basePrice);
    if (dto.minQuantity !== undefined) updateData.minQuantity = Number(dto.minQuantity);

    // Refresh denormalized products if productIds changed
    if (Array.isArray(dto.productIds)) {
      const prodSnaps = await Promise.all(
        dto.productIds.map((pid: string) =>
          this.firebase.getFirestore().collection('products').doc(pid).get(),
        ),
      );
      updateData.products = prodSnaps
        .filter((s) => s.exists)
        .map((s) => ({
          id: s.id,
          name: s.data()?.name || '',
          price: s.data()?.salesPrice || 0,
        }));
    }

    await ref.update(updateData);
    return { id, ...(doc.data() as any), ...updateData };
  }

  async setStatus(id: string, status: 'active' | 'inactive'): Promise<any> {
    const ref = this.collection.doc(id);
    await ref.update({
      status,
      updatedAt: new Date().toISOString(),
    });

    if (status === 'active') {
      this.eventEmitter.emit(EVENTS.PLAN_ACTIVATED, { planId: id });
    } else {
      this.eventEmitter.emit(EVENTS.PLAN_DEACTIVATED, { planId: id });
    }

    return { id, status };
  }
}
