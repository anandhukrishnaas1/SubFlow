import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class NotificationService {
  constructor(private readonly firebase: FirebaseService) {}

  private userNotifications(uid: string) {
    return this.firebase.getFirestore().collection('users').doc(uid).collection('notifications');
  }

  async send(uid: string, notif: { title: string; message: string; type?: string }): Promise<any> {
    const docRef = this.userNotifications(uid).doc();
    const data = {
      title: notif.title,
      message: notif.message,
      type: notif.type || 'info',
      read: false,
      createdAt: new Date().toISOString(),
    };
    await docRef.set(data);
    return { id: docRef.id, ...data };
  }

  async findAll(uid: string): Promise<any[]> {
    const snap = await this.userNotifications(uid).orderBy('createdAt', 'desc').limit(50).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async markAsRead(uid: string, notifId: string): Promise<{ success: boolean }> {
    await this.userNotifications(uid).doc(notifId).update({ read: true });
    return { success: true };
  }

  async markAllAsRead(uid: string): Promise<{ success: boolean }> {
    const unread = await this.userNotifications(uid).where('read', '==', false).get();
    const batch = this.firebase.getFirestore().batch();
    unread.docs.forEach((doc) => batch.update(doc.ref, { read: true }));
    await batch.commit();
    return { success: true };
  }
}
