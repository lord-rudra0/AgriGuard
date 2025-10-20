import NotificationToken from '../models/NotificationToken.js';
import webpush from 'web-push';

// Prune subscriptions that are no longer valid by attempting a lightweight push
export async function pruneStaleSubscriptions(options = {}) {
  const limit = options.limit || 200;
  const sample = await NotificationToken.find({}).limit(limit).lean();
  const results = { checked: 0, removed: 0 };

  const vapidConfigured = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  if (!vapidConfigured) {
    console.log('Prune job skipped: VAPID keys not configured');
    return results;
  }

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

  await Promise.all(sample.map(async (t) => {
    results.checked += 1;
    try {
      const sub = { endpoint: t.endpoint, keys: { p256dh: t.keys?.p256dh, auth: t.keys?.auth } };
      // send empty payload (some browsers require non-empty) - use short payload
      await webpush.sendNotification(sub, JSON.stringify({ title: 'ping', body: '' }));
    } catch (err) {
      const code = err && err.statusCode;
      if (code === 404 || code === 410) {
        await NotificationToken.deleteOne({ _id: t._id });
        results.removed += 1;
      }
    }
  }));

  console.log('Prune job completed', results);
  return results;
}
