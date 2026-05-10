export type LocalNotification = {
  id: string;
  title: string;
  body: string;
  type?: string;
  created_at: string;
  read: boolean;
  data?: Record<string, string>;
};

const STORAGE_KEY = 'saleshub_notifications';
const EVENT_NAME = 'saleshub-notifications-updated';

export function getLocalNotifications(): LocalNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalNotification(payload: {
  title: string;
  body: string;
  type?: string;
  data?: Record<string, string>;
}) {
  if (typeof window === 'undefined') return;
  const current = getLocalNotifications();
  const next: LocalNotification[] = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: payload.title,
      body: payload.body,
      type: payload.type || payload.data?.type,
      data: payload.data,
      created_at: new Date().toISOString(),
      read: false,
    },
    ...current,
  ].slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function markNotificationsRead() {
  if (typeof window === 'undefined') return;
  const next = getLocalNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function clearLocalNotifications() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function onNotificationsUpdated(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener('storage', callback);
  };
}
