import express from 'express';
import NotificationToken from '../models/NotificationToken.js';
import { authenticateToken } from '../middleware/auth.js';
import { getNotificationPreferences, evaluatePushDelivery } from '../services/notificationPreferences.js';

let webpush;
try {
  webpush = await import('web-push');
} catch (err) {
  // web-push not installed; endpoints will still work for register/unregister
  webpush = null;
}

const router = express.Router();

// Register a push subscription
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription' });
    }

    // Upsert token
    await NotificationToken.findOneAndUpdate(
      { userId: req.user._id, 'endpoint': subscription.endpoint },
      { userId: req.user._id, endpoint: subscription.endpoint, keys: subscription.keys },
      { upsert: true, new: true }
    );

    return res.json({ success: true, message: 'Subscribed' });
  } catch (error) {
    console.error('Subscribe error', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Unregister
router.post('/unsubscribe', authenticateToken, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ success: false, message: 'Missing endpoint' });

    await NotificationToken.deleteMany({ userId: req.user._id, endpoint });
    return res.json({ success: true, message: 'Unsubscribed' });
  } catch (error) {
    console.error('Unsubscribe error', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send a test notification to all tokens for the user
router.post('/send-test', authenticateToken, async (req, res) => {
  try {
    const prefs = await getNotificationPreferences(req.user._id);
    const delivery = evaluatePushDelivery({ prefs, severity: 'medium' });
    if (!delivery.allowed) {
      return res.status(200).json({
        success: true,
        skipped: true,
        deferred: !!delivery.deferred,
        message: delivery.reason || 'Test notification blocked by preferences'
      });
    }

    const tokens = await NotificationToken.find({ userId: req.user._id });

    if (!tokens || tokens.length === 0) {
      return res.status(404).json({ success: false, message: 'No subscriptions found' });
    }

    const payload = JSON.stringify({ title: 'AgriGuard Test', body: 'This is a test notification.' });

    if (!webpush) {
      // If web-push is not installed/available, just return success but note that
      return res.json({ success: true, message: 'Subscriptions present (server cannot send because web-push is not installed).' });
    }

    // Ensure VAPID keys configured
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(500).json({ success: false, message: 'VAPID keys not configured on server' });
    }

    webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:admin@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const sendPromises = tokens.map(t => {
      const sub = {
        endpoint: t.endpoint,
        keys: {
          p256dh: t.keys?.p256dh,
          auth: t.keys?.auth
        }
      };
      return webpush.sendNotification(sub, payload).catch(err => {
        console.warn('Failed to send to', t.endpoint, err && err.statusCode ? err.statusCode : err);
        // If unsubscribed at the browser, remove the token
        if (err && err.statusCode === 410) {
          return NotificationToken.deleteOne({ _id: t._id });
        }
      });
    });

    await Promise.all(sendPromises);

    return res.json({ success: true, message: 'Test notifications (attempted)' });
  } catch (error) {
    console.error('Send test error', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
