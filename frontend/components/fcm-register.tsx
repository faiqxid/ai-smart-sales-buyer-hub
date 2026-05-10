'use client';

import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { authApi, notifApi } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { saveLocalNotification } from '@/lib/notifications';
import { getMessagingIfSupported } from '@/lib/firebase';

async function registerFcmToken(requestPermission = false): Promise<boolean> {
  try {
    const user = getUser();
    if (!user) return false;

    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.info('[FCM] Notification API tidak didukung browser ini');
      return false;
    }

    let permission = Notification.permission;
    if (permission === 'default' && requestPermission) {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.info(`[FCM] Izin notifikasi belum diberikan: ${permission}`);
      return false;
    }

    const messaging = await getMessagingIfSupported();
    if (!messaging) {
      console.info('[FCM] Firebase messaging tidak didukung browser ini');
      return false;
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY belum diset');
      return false;
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) {
      console.warn('[FCM] Token kosong, tidak bisa register');
      return false;
    }

    await notifApi.registerToken(token, 'web');
    console.info('[FCM] Token berhasil diregistrasi ke backend');
    return true;
  } catch (err) {
    console.error('[FCM] Gagal registrasi token:', err);
    return false;
  }
}

export default function FcmRegister() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || !getUser()) return;

    let unsubOnMessage: undefined | (() => void);

    (async () => {
      if (Notification.permission === 'granted') {
        await registerFcmToken(false);

        const messaging = await getMessagingIfSupported();
        if (messaging) {
          unsubOnMessage = onMessage(messaging, (payload) => {
            console.info('[FCM] Foreground message received:', payload);
            const title = payload.notification?.title || payload.data?.title || 'Notifikasi Baru';
            const body = payload.notification?.body || payload.data?.body || '';
            saveLocalNotification({ title, body, type: payload.data?.type, data: payload.data as Record<string, string> | undefined });

            if (Notification.permission === 'granted') {
              const notif = new Notification(title, { body, icon: '/icons/icon-192x192.png' });
              notif.onclick = () => {
                window.focus();
              };
            }
          });
        }
      } else if (Notification.permission === 'default') {
        setShowPrompt(true);
      } else {
        console.info('[FCM] Notifikasi diblokir browser. Aktifkan manual dari Site Settings.');
      }
    })();

    return () => {
      if (unsubOnMessage) unsubOnMessage();
    };
  }, []);

  async function handleEnable() {
    setLoading(true);
    const ok = await registerFcmToken(true);
    setLoading(false);
    if (ok || Notification.permission !== 'default') setShowPrompt(false);
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border border-amber-200 bg-white p-4 shadow-lg md:left-auto md:right-6 md:max-w-sm">
      <p className="text-sm font-semibold text-slate-900">Aktifkan notifikasi pesanan?</p>
      <p className="mt-1 text-xs text-slate-600">
        Supaya update order dan stok bisa masuk langsung ke device kamu.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleEnable}
          disabled={loading}
          className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Mengaktifkan...' : 'Aktifkan'}
        </button>
        <button
          type="button"
          onClick={() => setShowPrompt(false)}
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Nanti
        </button>
      </div>
    </div>
  );
}
