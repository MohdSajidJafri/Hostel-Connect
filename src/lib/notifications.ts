export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function notifyNewMessage(senderName: string, content: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!document.hidden) return;
  try {
    new Notification(`Message from ${senderName}`, {
      body: content.slice(0, 120),
      icon: '/favicon.svg',
    });
  } catch {
    // Ignore notification errors in restricted contexts
  }
}
