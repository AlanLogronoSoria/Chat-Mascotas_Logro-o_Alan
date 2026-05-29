import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../supabase/client';
import { NotificationRepository } from './NotificationRepository';

const isExpoGo = Constants.appOwnership === 'expo';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const notifRepo = new NotificationRepository();

// ============================================
// REGISTRO DE TOKEN PUSH
// ============================================
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo) {
    console.warn('[PetAdopt Push] Expo Go: notificaciones remotas no disponibles. Usando modo local.');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[PetAdopt Push] Permiso de notificaciones denegado.');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      ?? Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

    if (tokenData?.data) {
      console.log('[PetAdopt Push] Token registrado:', tokenData.data.substring(0, 12) + '...');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('adoption', {
        name: 'Solicitudes de Adopción',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00F0FF',
        sound: 'default',
      });
    }

    return tokenData?.data ?? null;
  } catch (e) {
    console.error('[PetAdopt Push] Error registrando token:', e);
    return null;
  }
}

// ============================================
// NOTIFICACIÓN: NUEVA SOLICITUD DE ADOPCIÓN
// ============================================
export async function notifyShelterNewApplication(params: {
  shelterId: string;
  adopterName: string;
  petName: string;
  applicationId: string;
}): Promise<void> {
  const { shelterId, adopterName, petName, applicationId } = params;
  const title = 'Nueva solicitud de adopción';
  const body = `${adopterName} quiere adoptar a ${petName}`;

  await notifRepo.create({
    userId: shelterId,
    title,
    body,
    type: 'new_application',
    applicationId,
    read: false,
  });

  if (isExpoGo) {
    console.log(`[PetAdopt Push Sim] Refugio ${shelterId}: ${title} - ${body}`);
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: { applicationId, type: 'new_application' },
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[PetAdopt Push] Error notificando refugio:', e);
  }
}

// ============================================
// NOTIFICACIÓN: ACTUALIZACIÓN DE ESTADO
// ============================================
export async function notifyAdopterStatusUpdate(params: {
  adopterId: string;
  petName: string;
  newStatus: string;
  applicationId: string;
}): Promise<void> {
  const { adopterId, petName, newStatus, applicationId } = params;

  const statusLabel: Record<string, string> = {
    enviada: 'enviada',
    revisando: 'en revisión',
    entrevista: 'en fase de entrevista',
    aprobada: 'aprobada',
    rechazada: 'rechazada',
  };

  const label = statusLabel[newStatus] || newStatus;
  const title = 'Solicitud actualizada';
  const body = `Tu solicitud para adoptar a ${petName} fue ${label}`;

  await notifRepo.create({
    userId: adopterId,
    title,
    body,
    type: 'status_update',
    applicationId,
    read: false,
  });

  if (isExpoGo) {
    console.log(`[PetAdopt Push Sim] Adoptante ${adopterId}: ${title} - ${body}`);
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: { applicationId, type: 'status_update' },
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[PetAdopt Push] Error notificando adoptante:', e);
  }
}

// ============================================
// NOTIFICACIÓN: MENSAJE DE CHAT
// ============================================
export async function showMessageNotification(roomId: string, author: string, content: string) {
  if (isExpoGo) {
    console.log(`[PetAdopt Push Sim] Mensaje de ${author}: ${content}`);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Mensaje de ${author}`,
      body: content,
      data: { roomId, type: 'chat_message' },
    },
    trigger: null,
  });
}
