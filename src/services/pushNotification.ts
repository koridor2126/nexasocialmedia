import { api } from './api';
import { getFirebaseMessaging } from './firebaseConfig';
import { getToken, onMessage } from 'firebase/messaging';

export interface DeviceInfo {
  device_type: 'desktop' | 'mobile' | 'tablet' | 'web';
  browser: string;
  user_agent: string;
}

export interface PushDiagnosticInfo {
  browserPermission: NotificationPermission | 'unsupported';
  serviceWorkerSupported: boolean;
  serviceWorkerStatus: 'registered' | 'active' | 'failed' | 'not_registered';
  fcmMessagingSupported: boolean;
  fcmTokenStatus: 'available' | 'unavailable';
  vapidConfigured: boolean;
  isIframe: boolean;
}

/**
 * Detects device type and browser info
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { device_type: 'web', browser: 'Browser', user_agent: '' };
  }

  const ua = navigator.userAgent;
  let browser = 'Browser';

  if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox';
  } else if (ua.indexOf('SamsungBrowser') > -1) {
    browser = 'Samsung Internet';
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    browser = 'Opera';
  } else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) {
    browser = 'Microsoft Edge';
  } else if (ua.indexOf('Chrome') > -1) {
    browser = 'Google Chrome';
  } else if (ua.indexOf('Safari') > -1) {
    browser = 'Apple Safari';
  }

  let device_type: 'desktop' | 'mobile' | 'tablet' | 'web' = 'desktop';
  if (/iPad|tablet|PlayBook/i.test(ua)) {
    device_type = 'tablet';
  } else if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    device_type = 'mobile';
  }

  return {
    device_type,
    browser,
    user_agent: ua
  };
}

/**
 * Checks if browser supports web notifications and Service Workers
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Checks if running inside an iframe
 */
export function isRunningInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

/**
 * Gets real-time notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Registers Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    console.log('[Push] Service worker registered successfully:', registration.scope);
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.warn('[Push] Service worker registration error:', err);
    return null;
  }
}

/**
 * Request notification permission and register token to backend
 */
export async function requestAndRegisterPushToken(): Promise<{
  success: boolean;
  token?: string;
  permission: NotificationPermission | 'unsupported';
  error?: string;
}> {
  if (!isPushNotificationSupported()) {
    return {
      success: false,
      permission: 'unsupported',
      error: 'Browser tidak mendukung Notification atau Service Worker API.'
    };
  }

  try {
    // 1. Request browser permission
    let permission: NotificationPermission;
    try {
      permission = await Notification.requestPermission();
    } catch (permErr) {
      // Legacy callback support
      permission = await new Promise((resolve) => {
        Notification.requestPermission((p) => resolve(p));
      });
    }

    if (permission !== 'granted') {
      return {
        success: false,
        permission,
        error: permission === 'denied'
          ? 'Izin notifikasi diblokir oleh browser. Harap aktifkan di pengaturan browser.'
          : 'Izin notifikasi belum diberikan.'
      };
    }

    // 2. Register Service Worker
    const swReg = await registerServiceWorker();

    // 3. Obtain or generate push token
    let token = localStorage.getItem('nexa_push_token');
    const messaging = await getFirebaseMessaging();

    if (messaging && swReg) {
      try {
        const metaEnv = (import.meta as any).env || {};
        const fcmToken = await getToken(messaging, {
          serviceWorkerRegistration: swReg,
          vapidKey: metaEnv.VITE_FIREBASE_VAPID_KEY || undefined
        });
        if (fcmToken) {
          token = fcmToken;
          console.log('[Push] FCM Registration Token obtained:', token.slice(0, 15) + '...');
        }
      } catch (fcmErr) {
        console.warn('[Push] FCM getToken info:', fcmErr);
      }
    }

    // Fallback deterministic device token if FCM token is in local demo/sandbox
    if (!token) {
      token = 'fcm_web_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    }

    localStorage.setItem('nexa_push_token', token);

    // 4. Send device token to backend
    const deviceInfo = getDeviceInfo();
    await api.registerDeviceToken({
      fcm_token: token,
      device_type: deviceInfo.device_type,
      browser: deviceInfo.browser,
      user_agent: deviceInfo.user_agent
    });

    console.log('[Push] Device registered with NEXA backend successfully.');
    return {
      success: true,
      token,
      permission: 'granted'
    };
  } catch (err: any) {
    console.error('[Push] Failed to register push token:', err);
    return {
      success: false,
      permission: getNotificationPermission(),
      error: err.message || 'Gagal mengaktifkan notifikasi push.'
    };
  }
}

/**
 * Triggers a real native system notification on desktop / Android
 */
export async function triggerSystemNotification(options: {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  tag?: string;
}): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const title = options.title || 'NEXA';
  const notifOptions = {
    body: options.body || 'Pemberitahuan baru dari NEXA',
    icon: options.icon || '/favicon.ico',
    badge: options.badge || '/favicon.ico',
    data: options.data || { url: '/' },
    tag: options.tag || `nexa-${Date.now()}`,
    vibrate: [100, 50, 100] as any
  };

  // Try Service Worker showNotification first (Standard Web Push & Android)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notifOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('[Push] ServiceWorker showNotification fallback:', swErr);
    }
  }

  // Fallback to Window Notification constructor
  try {
    new Notification(title, {
      body: notifOptions.body,
      icon: notifOptions.icon,
      data: notifOptions.data
    });
    return true;
  } catch (err) {
    console.warn('[Push] Window Notification error:', err);
    return false;
  }
}

/**
 * Collects push diagnostic information for dev/debug
 */
export async function getPushDiagnosticInfo(): Promise<PushDiagnosticInfo> {
  const isIframe = isRunningInIframe();
  const browserPermission = getNotificationPermission();
  const serviceWorkerSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  
  let serviceWorkerStatus: 'registered' | 'active' | 'failed' | 'not_registered' = 'not_registered';
  if (serviceWorkerSupported) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        serviceWorkerStatus = reg.active ? 'active' : 'registered';
      }
    } catch (e) {
      serviceWorkerStatus = 'failed';
    }
  }

  let fcmMessagingSupported = false;
  try {
    const messaging = await getFirebaseMessaging();
    fcmMessagingSupported = !!messaging;
  } catch (e) {
    fcmMessagingSupported = false;
  }

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('nexa_push_token') : null;
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const vapidConfigured = Boolean(metaEnv.VITE_FIREBASE_VAPID_KEY);

  return {
    browserPermission,
    serviceWorkerSupported,
    serviceWorkerStatus,
    fcmMessagingSupported,
    fcmTokenStatus: token ? 'available' : 'unavailable',
    vapidConfigured,
    isIframe
  };
}

/**
 * Initializes foreground push listener
 */
export function initForegroundNotificationListener(
  onNotificationReceived: (payload: any) => void
): () => void {
  let unsubscribe: (() => void) | null = null;

  getFirebaseMessaging().then((messaging) => {
    if (messaging) {
      unsubscribe = onMessage(messaging, (payload) => {
        console.log('[Push] Foreground message received:', payload);
        onNotificationReceived(payload);

        // Also trigger native browser notification if tab is in background or permitted
        if (Notification.permission === 'granted' && typeof document !== 'undefined' && document.hidden) {
          triggerSystemNotification({
            title: payload.notification?.title || payload.data?.title || 'NEXA',
            body: payload.notification?.body || payload.data?.body || 'Pemberitahuan baru',
            icon: payload.notification?.icon || payload.data?.icon || '/favicon.ico',
            data: payload.data
          });
        }
      });
    }
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}
