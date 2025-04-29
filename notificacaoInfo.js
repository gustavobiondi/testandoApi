// NotificacaoInfo.js (ou dentro do mesmo arquivo)
import React from 'react';
import { Text, View } from 'react-native';
import { usePushNotifications } from './usePushNotifications'; // ajuste o caminho conforme necessário

export default function NotificacaoInfo() {
  const { expoPushToken, notification } = usePushNotifications();
  const token = typeof expoPushToken === 'string' ? expoPushToken : expoPushToken?.data ?? 'Sem token';
  const data = JSON.stringify(notification, null, 2);

  return (
    <View>
      <Text>Token: {token}</Text>
      <Text>Notification: {data}</Text>
    </View>
  );
}
