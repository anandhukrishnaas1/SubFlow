import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';

@Injectable()
export class ProductService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private get collection() {
    return this.firebase.getFirestore().collection('products');
  }

  async findAll(status?: string): Promise<any[]> {
    let q: FirebaseFirestore.Query = this.collection;
    if (status) {
      q = q.where('status', '==', status);
    }
    const snap = await q.get();

    // Fetch variants in parallel for rich presentation
    const products = await Promise.all(
      snap.docs.map(async (doc) => {
        const data = doc.data();
        const varSnap = await doc.ref.collection('variants').get();
        const variants = varSnap.docs.map((v) => ({ id: v.id, ...v.data() }));
        return { id: doc.id, ...data, variants };
      }),
    );

    return products;
  }

  async findOne(id: string): Promise<any> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const varSnap = await doc.ref.collection('variants').get();
    const variants = varSnap.docs.map((v) => ({ id: v.id, ...v.data() }));

    return { id: doc.id, ...doc.data(), variants };
  }

  async create(dto: any): Promise<any> {
    const docRef = this.collection.doc();
    const now = new Date().toISOString();

    const productData = {
      name: dto.name,
      type: dto.type || 'service',
      salesPrice: Number(dto.salesPrice) || 0,
      costPrice: Number(dto.costPrice) || 0,
      notes: dto.notes || '',
      status: dto.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(productData);

    // Save variants if provided
    const variants: any[] = [];
    if (Array.isArray(dto.variants) && dto.variants.length > 0) {
      const batch = this.firebase.getFirestore().batch();
      for (const v of dto.variants) {
        const vRef = docRef.collection('variants').doc();
        const vData = {
          name: v.name,
          additionalPrice: Number(v.additionalPrice) || 0,
          createdAt: now,
        };
        batch.set(vRef, vData);
        variants.push({ id: vRef.id, ...vData });
      }
      await batch.commit();
    }

    this.eventEmitter.emit(EVENTS.PRODUCT_CREATED, {
      productId: docRef.id,
      productName: productData.name,
      salesPrice: productData.salesPrice,
    });

    return { id: docRef.id, ...productData, variants };
  }

  async update(id: string, dto: any): Promise<any> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.salesPrice !== undefined) updateData.salesPrice = Number(dto.salesPrice);
    if (dto.costPrice !== undefined) updateData.costPrice = Number(dto.costPrice);
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.status !== undefined) updateData.status = dto.status;

    await ref.update(updateData);

    // Update variants if provided
    if (Array.isArray(dto.variants)) {
      // Clear existing variants
      const existingVariants = await ref.collection('variants').get();
      const batch = this.firebase.getFirestore().batch();
      existingVariants.docs.forEach((v) => batch.delete(v.ref));

      // Add new variants
      for (const v of dto.variants) {
        const vRef = ref.collection('variants').doc();
        batch.set(vRef, {
          name: v.name,
          additionalPrice: Number(v.additionalPrice) || 0,
          createdAt: new Date().toISOString(),
        });
      }
      await batch.commit();
    }

    return this.findOne(id);
  }

  async archive(id: string): Promise<any> {
    await this.collection.doc(id).update({
      status: 'archived',
      updatedAt: new Date().toISOString(),
    });
    this.eventEmitter.emit(EVENTS.PRODUCT_ARCHIVED, { productId: id });
    return { success: true, id };
  }
}
