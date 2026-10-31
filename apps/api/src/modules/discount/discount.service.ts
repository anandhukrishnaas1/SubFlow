import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';

@Injectable()
export class DiscountService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private get collection() {
    return this.firebase.getFirestore().collection('discounts');
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
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() };
  }

  async validateCode(code: string, amount: number = 0): Promise<any> {
    const snap = await this.collection
      .where('code', '==', code.toUpperCase().trim())
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (snap.empty) {
      throw new BadRequestException('Invalid or inactive discount code');
    }

    const doc = snap.docs[0];
    const discount = { id: doc.id, ...doc.data() } as any;

    const now = new Date();
    if (discount.startDate && new Date(discount.startDate) > now) {
      throw new BadRequestException('This discount code is not yet active');
    }
    if (discount.endDate && new Date(discount.endDate) < now) {
      throw new BadRequestException('This discount code has expired');
    }
    if (discount.maxUsage && discount.currentUsage >= discount.maxUsage) {
      this.eventEmitter.emit(EVENTS.DISCOUNT_EXHAUSTED, {
        discountId: discount.id,
        discountCode: discount.code,
      });
      throw new BadRequestException('This discount code has reached its usage limit');
    }
    if (discount.minPurchase && amount < discount.minPurchase) {
      throw new BadRequestException(`Minimum purchase amount of $${discount.minPurchase} required`);
    }

    return discount;
  }

  async create(dto: any): Promise<any> {
    const docRef = this.collection.doc();
    const now = new Date().toISOString();

    const discountData = {
      name: dto.name,
      code: (dto.code || '').toUpperCase().trim(),
      type: dto.type || 'percentage',
      value: Number(dto.value) || 0,
      minPurchase: Number(dto.minPurchase) || 0,
      minQuantity: Number(dto.minQuantity) || 0,
      startDate: dto.startDate || now,
      endDate: dto.endDate || null,
      maxUsage: dto.maxUsage ? Number(dto.maxUsage) : null,
      currentUsage: 0,
      applicableProductIds: dto.applicableProductIds || [],
      appliesToEntireSubscription: dto.appliesToEntireSubscription ?? true,
      status: dto.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(discountData);
    return { id: docRef.id, ...discountData };
  }

  async update(id: string, dto: any): Promise<any> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    const updateData: any = {
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    if (dto.code) updateData.code = dto.code.toUpperCase().trim();
    if (dto.value !== undefined) updateData.value = Number(dto.value);
    delete updateData.id;

    await ref.update(updateData);
    return { id, ...(doc.data() as any), ...updateData };
  }

  async incrementUsage(id: string): Promise<void> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) return;

    const data = doc.data() as any;
    const newUsage = (data.currentUsage || 0) + 1;
    const update: any = { currentUsage: newUsage };

    if (data.maxUsage && newUsage >= data.maxUsage) {
      update.status = 'inactive';
      this.eventEmitter.emit(EVENTS.DISCOUNT_EXHAUSTED, {
        discountId: id,
        discountCode: data.code,
      });
    }

    await ref.update(update);
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await this.collection.doc(id).delete();
    return { success: true };
  }
}
