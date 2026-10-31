import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class TaxService {
  constructor(private readonly firebase: FirebaseService) {}

  private get collection() {
    return this.firebase.getFirestore().collection('taxes');
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
      throw new NotFoundException(`Tax with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() };
  }

  async create(dto: any): Promise<any> {
    const docRef = this.collection.doc();
    const now = new Date().toISOString();

    const taxData = {
      name: dto.name,
      percentage: Number(dto.percentage) || 0,
      type: dto.type || 'percentage',
      status: dto.status || 'active',
      applicableProductIds: dto.applicableProductIds || [],
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(taxData);
    return { id: docRef.id, ...taxData };
  }

  async update(id: string, dto: any): Promise<any> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundException(`Tax with ID ${id} not found`);
    }

    const updateData: any = {
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    if (dto.percentage !== undefined) updateData.percentage = Number(dto.percentage);
    delete updateData.id;

    await ref.update(updateData);
    return { id, ...(doc.data() as any), ...updateData };
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await this.collection.doc(id).delete();
    return { success: true };
  }
}
