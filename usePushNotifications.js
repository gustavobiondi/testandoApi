import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

export const usePushNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldShowAlert: true,
      shouldSetBadge: false,
    }),
  });

  const [expoPushToken, setExpoPushToken] = useState();
  const [notification, setNotification] = useState();

  const notificationListener = useRef();
  const responseListener = useRef();

  async function registerForPushNotificationAsync() {
    if (!Device.isDevice) {
      console.error("ERROR: Use um dispositivo real, o simulador não funciona para push notifications.");
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert('Failed to get the push token!');
      return;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token; // 🔁 Retorna o objeto completo { type, data }
  }

  useEffect(() => {
    registerForPushNotificationAsync().then((token) => {
      if (token) {
        setExpoPushToken(token); // ⬅️ Agora expoPushToken terá .data
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
};
