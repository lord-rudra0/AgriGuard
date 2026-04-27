import { useEffect } from "react";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { Capacitor } from "@capacitor/core";

/**
 * useNotifications – requests permission and wires up FCM listeners.
 * Works on native Android via @capacitor-firebase/messaging.
 *
 * @param {function} onMessage - called with { title, body } when a notification arrives
 */
export default function useNotifications(onMessage) {
  useEffect(() => {
    // Only run on native Android/iOS; skip in plain browser
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

        // 2️⃣ Get the FCM token and log it (send to backend when ready)
        const { token } = await FirebaseMessaging.getToken();
        console.log("✅ FCM Token:", token);
        // TODO: send `token` to your backend to target this device

        // 3️⃣ Listen for foreground notifications
        pushListener = await FirebaseMessaging.addListener(
          "notificationReceived",
          (event) => {
            const { title, body } = event.notification;
            if (onMessage) onMessage({ title, body });
          }
        );

        // 4️⃣ Listen for notification tap (app in background/killed)
        actionListener = await FirebaseMessaging.addListener(
          "notificationActionPerformed",
          (event) => {
            console.log("Notification tapped:", event.notification);
            // TODO: navigate to relevant page based on event.notification.data
          }
        );
      } catch (err) {
        console.error("FCM setup error:", err);
      }
    }

    setup();

    // Cleanup on unmount
    return () => {
      pushListener?.remove();
      actionListener?.remove();
    };
  }, [onMessage]);
}
