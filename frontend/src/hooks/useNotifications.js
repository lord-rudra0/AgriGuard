import { useEffect } from "react";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { Capacitor } from "@capacitor/core";
import axios from "axios";

/**
 * useNotifications – requests FCM permission, retrieves the device token,
 * registers it with the backend, and sets up foreground/background listeners.
 *
 * @param {function} [onMessage] - optional callback ({ title, body, data }) for foreground messages
 */
export default function useNotifications(onMessage) {
  useEffect(() => {
    // Only run inside the native Capacitor container (Android / iOS)
    if (!Capacitor.isNativePlatform()) return;

    let pushListener;
    let actionListener;

    async function setup() {
      try {
        // 1️⃣ Request permission
        const { receive } = await FirebaseMessaging.requestPermissions();
        if (receive !== "granted") {
          console.warn("Push notification permission not granted");
          return;
        }

        // 2️⃣ Get FCM device token
        const { token } = await FirebaseMessaging.getToken();
        if (!token) {
          console.warn("FCM: could not get token");
          return;
        }
        console.log("✅ FCM Token:", token);

        // Create Android channel so background pushes show up (Required for Android 8+)
        // Note: Channel settings are immutable on Android, so we use _v2 to ensure sound changes apply
        if (Capacitor.getPlatform() === "android") {
          await FirebaseMessaging.createChannel({
            id: "agriguard_alerts_v2",
            name: "AgriGuard Alerts",
            description: "Critical sensor alerts and chat messages",
            importance: 4, // High
            visibility: 1, // Public
            vibration: true,
            lights: true,
          });
        }

        // 3️⃣ Register token with backend (upserts – safe to call on every launch)
        try {
          await axios.post("/api/notifications/register-fcm", {
            fcmToken: token,
            platform: Capacitor.getPlatform(), // 'android' | 'ios'
          });
        } catch (err) {
          console.warn("FCM token registration with backend failed:", err?.response?.data || err?.message);
        }

        // 4️⃣ Foreground message listener
        pushListener = await FirebaseMessaging.addListener(
          "notificationReceived",
          (event) => {
            const { title, body } = event.notification;
            const data = event.notification.data || {};
            if (onMessage) onMessage({ title, body, data });
          }
        );

        // 5️⃣ Notification tap listener (app in background or killed)
        actionListener = await FirebaseMessaging.addListener(
          "notificationActionPerformed",
          (event) => {
            const data = event.notification?.data || {};
            console.log("Notification tapped:", data);
            // TODO: navigate to data.screen when you add react-router navigation here
          }
        );
      } catch (err) {
        console.error("FCM setup error:", err);
      }
    }

    setup();

    return () => {
      pushListener?.remove();
      actionListener?.remove();
    };
  }, [onMessage]);
}

