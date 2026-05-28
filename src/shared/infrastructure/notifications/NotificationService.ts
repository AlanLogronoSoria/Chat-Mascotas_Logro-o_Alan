import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

// Importamos la librería de forma dinámica solo si NO es Expo Go
let Notifications: any;
if (!isExpoGo) {
  Notifications = require('expo-notifications');
  
  // Configuramos el manejador solo si estamos fuera de Expo Go
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotificationsAsync() {
  if (isExpoGo) {
    console.warn('⚠️ Expo Go: Notificaciones remotas desactivadas.');
    return null;
  }
  
  // Aquí usas la variable 'Notifications' que importamos dinámicamente
  // (Debes envolver la lógica en un try-catch)
  try {
    // ... tu lógica de permisos y token ...
  } catch (e) {
    console.error(e);
  }
}

export async function showMessageNotification(roomId: string, author: string, content: string) {
  if (isExpoGo) {
    console.log(`[Simulación] Notificación para ${author}: ${content}`);
    return;
  }
  
  await Notifications.scheduleNotificationAsync({
    content: { title: `Mensaje de ${author}`, body: content },
    trigger: null,
  });
}