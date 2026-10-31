import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class ActivityService {
  constructor(private readonly firebase: FirebaseService) {}

  private get collection() {
    return this.firebase.getFirestore().collection('activityLogs');
  }

  async log(data: {
    userId?: string;
    userName?: string;
    action: string;
    entity: string;
    entityId: string;
    description: string;
    metadata?: any;
  }): Promise<any> {
    const docRef = this.collection.doc();
    const logEntry = {
      userId: data.userId || 'system',
      userName: data.userName || 'System',
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      description: data.description,
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
    };
    await docRef.set(logEntry);
    return { id: docRef.id, ...logEntry };
  }

  async findAll(limit: number = 100, entity?: string): Promise<any[]> {
    let q: FirebaseFirestore.Query = this.collection;
    if (entity) {
      q = q.where('entity', '==', entity);
    }
    const snap = await q.orderBy('createdAt', 'desc').limit(limit).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}
