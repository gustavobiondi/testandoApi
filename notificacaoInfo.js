import React from 'react';
import { View, Text } from 'react-native';
import { usePushNotifications } from './usePushNotifications';

export default function NotificacaoInfo() {
  const { expoPushToken, notification } = usePushNotifications();

  return (
    <View style={{ padding: 20 }}>
      <Text>Expo Push Token:</Text>
      <Text selectable>{expoPushToken ?? 'Carregando token...'}</Text>

      <Text style={{ marginTop: 20 }}>Notificação recebida:</Text>
      <Text selectable>{JSON.stringify(notification, null, 2)}</Text>
    </View>
  );
}
