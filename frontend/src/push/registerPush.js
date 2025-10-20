// Helper to register service worker and manage web push subscription
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (err) {
    console.error('Service Worker registration failed', err);
    return null;
  }
}

export async function subscribeToPush(vapidPublicKey) {
  if (!('PushManager' in window)) throw new Error('Push not supported');
  const reg = await registerServiceWorker();
  if (!reg) throw new Error('Service worker not registered');

  // Convert VAPID key
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });

  return sub;
}

export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return true;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return true;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;
  await sub.unsubscribe();
  return true;
}
