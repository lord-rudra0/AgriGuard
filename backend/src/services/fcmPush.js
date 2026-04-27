// ----------------------------------------------------------
// fcmPush.js – Firebase Admin FCM push notification service
// ----------------------------------------------------------
import admin from 'firebase-admin';
import NotificationToken from '../models/NotificationToken.js';

let initialized = false;

export function initFirebase() {
  if (initialized || admin.apps.length > 0) return;

  // Use GOOGLE_APPLICATION_CREDENTIALS env var (path to serviceAccountKey.json)
  // OR use individual env vars for the service account fields
  const projectId     = process.env.FIREBASE_PROJECT_ID;
  const clientEmail   = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey    = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    initialized = true;
    console.log('✅ Firebase Admin initialized');
  } else {
    console.warn('⚠️  Firebase Admin not initialized: missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY env vars. Push notifications will be skipped.');
  }
}

/**
 * Send an FCM push notification to all registered devices for a user.
 *
 * @param {string|ObjectId} userId
 * @param {{ title: string, body: string, data?: Record<string,string> }} notification
 * @returns {Promise<{ sent: number, failed: number }>}
 */
export async function sendPushToUser(userId, { title, body, data = {} }) {
  // Ensure Firebase is initialized (env vars are loaded by now)
  initFirebase();

  if (!initialized && admin.apps.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const tokens = await NotificationToken.find({ userId }).select('fcmToken _id').lean();
  if (!tokens.length) return { sent: 0, failed: 0 };

  const fcmTokens = tokens.map(t => t.fcmToken).filter(Boolean);
  if (!fcmTokens.length) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const staleTokens = [];

  // Send one message per token so we can track failures individually
  await Promise.all(
    fcmTokens.map(async (token) => {
      try {
        await admin.messaging().send({
          token,
          notification: { title, body },
          data: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)])
          ),
          android: { priority: 'high' },
        });
        sent++;
      } catch (err) {
        failed++;
        // registration-token-not-registered or invalid-registration-token → stale token
        const errCode = err?.errorInfo?.code || '';
        if (
          errCode.includes('registration-token-not-registered') ||
          errCode.includes('invalid-registration-token')
        ) {
          staleTokens.push(token);
        }
        console.warn(`FCM send failed for token ${token.slice(0, 20)}…: ${errCode || err?.message}`);
      }
    })
  );

  // Clean up stale tokens
  if (staleTokens.length) {
    await NotificationToken.deleteMany({ fcmToken: { $in: staleTokens } });
    console.log(`🗑️  Removed ${staleTokens.length} stale FCM token(s)`);
  }

  return { sent, failed };
}
