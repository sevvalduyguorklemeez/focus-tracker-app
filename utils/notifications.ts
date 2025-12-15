import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Bildirim handler'ı ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Bildirim izinlerini iste
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Android için notification channel oluştur
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4A90E2',
      });
    }

    return true;
  } catch (error) {
    console.error('Bildirim izni hatası:', error);
    return false;
  }
}

// Yerel bildirim gönder
export async function scheduleNotification(
  title: string,
  body: string,
  seconds: number = 0
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Bildirim izni verilmedi');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: seconds > 0 ? { seconds } : null,
    });

    return notificationId;
  } catch (error) {
    console.error('Bildirim gönderme hatası:', error);
    return null;
  }
}

// Tüm bekleyen bildirimleri iptal et
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Bildirim iptal hatası:', error);
  }
}

// Belirli bir bildirimi iptal et
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Bildirim iptal hatası:', error);
  }
}

// Timer bittiğinde bildirim gönder
export async function sendTimerCompleteNotification(
  category: string,
  duration: number
): Promise<void> {
  await scheduleNotification(
    '🎉 Seans Tamamlandı!',
    `${category} seansınız ${duration} dakika boyunca başarıyla tamamlandı!`,
    0
  );
}

// Hatırlatma bildirimi gönder (örneğin yarı yolda)
export async function scheduleReminderNotification(
  seconds: number,
  category: string
): Promise<string | null> {
  return await scheduleNotification(
    '⏰ Odaklanma Hatırlatıcısı',
    `${category} seansınız devam ediyor. Odaklanmaya devam edin!`,
    seconds
  );
}
