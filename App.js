import React, { useEffect, useState } from 'react';
import { View, Text, Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export default function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    async function getToken() {
      console.log('🔍 Iniciando processo de obter token...');
      if (!Device.isDevice) {
        Alert.alert('Erro', 'Push Notifications só funcionam em dispositivo físico');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('🔍 Permissão existente:', existingStatus);
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        console.log('🔍 Nova permissão:', status);
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Permissão negada', 'Você precisa permitir notificações para receber push.');
        return;
      }

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        console.log('✅ Token obtido:', tokenData.data);
        setToken(tokenData.data);
      } catch (e) {
        console.error('❌ Erro ao obter token:', JSON.stringify(e, null, 2));
        Alert.alert('Erro', e.message ?? 'Não foi possível obter o token');
      }
      

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }
    }

    getToken();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontWeight: 'bold' }}>Expo Push Token:</Text>
      <Text selectable>{token ?? 'Carregando token...'}</Text>
    </View>
  );
}
