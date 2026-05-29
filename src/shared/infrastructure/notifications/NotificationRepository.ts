import { create } from 'zustand';
import { supabase } from '../supabase/client';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'new_application' | 'status_update' | 'chat_message';
  applicationId?: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  setNotifications: (notifs: AppNotification[]) => void;
  addNotification: (notif: AppNotification) => void;
  markAsRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
  }),
  addNotification: (notif) => set((state) => ({
    notifications: [notif, ...state.notifications],
    unreadCount: notif.read ? state.unreadCount : state.unreadCount + 1,
  })),
  markAsRead: (id) => set((state) => {
    const updated = state.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    return {
      notifications: updated,
      unreadCount: updated.filter(n => !n.read).length,
    };
  }),
}));

export class NotificationRepository {
  async fetchForUser(userId: string): Promise<AppNotification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped: AppNotification[] = (data || []).map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        title: d.title,
        body: d.body,
        type: d.type,
        applicationId: d.application_id,
        read: d.read,
        createdAt: new Date(d.created_at),
      }));

      useNotificationStore.getState().setNotifications(mapped);
      return mapped;
    } catch (e) {
      console.warn('[NotifRepo] Error fetching:', e);
      return [];
    }
  }

  async create(params: {
    userId: string;
    title: string;
    body: string;
    type: AppNotification['type'];
    applicationId?: string;
    read: boolean;
  }): Promise<AppNotification | null> {
    const notif: AppNotification = {
      id: Math.random().toString(36).substring(2),
      ...params,
      createdAt: new Date(),
    };

    useNotificationStore.getState().addNotification(notif);

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: params.userId,
          title: params.title,
          body: params.body,
          type: params.type,
          application_id: params.applicationId,
          read: params.read,
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        body: data.body,
        type: data.type,
        applicationId: data.application_id,
        read: data.read,
        createdAt: new Date(data.created_at),
      };
    } catch (e) {
      console.warn('[NotifRepo] Error creating:', e);
      return notif;
    }
  }

  async markAsRead(id: string): Promise<void> {
    useNotificationStore.getState().markAsRead(id);
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
    } catch (e) {
      console.warn('[NotifRepo] Error marking as read:', e);
    }
  }
}
