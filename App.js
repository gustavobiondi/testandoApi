import { useContext, useEffect, useState } from 'react';
import { UserContext } from './UserContext';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './screens/url';

export default function App() {
  const { user } = useContext(UserContext);
  const [token, setToken] = useState(null);

  useEffect(() => {
    async function getToken() {
      if (!Device.isDevice || !user?.username) {
        // Se não for dispositivo físico ou não tiver usuário logado
        return;
      }

      // Verifique se o token já está salvo no AsyncStorage
      const savedToken = await AsyncStorage.getItem(`pushToken_${user.username}`);
      if (savedToken) {
        console.log('🔍 Token encontrado no AsyncStorage:', savedToken);
        setToken(savedToken);
        return; // Já tem token, não precisa gerar um novo
      }

      // Se não encontrou no AsyncStorage, solicita um novo
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Permissão negada');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      setToken(tokenData.data);

      // Salve o token no AsyncStorage
      await AsyncStorage.setItem(`pushToken_${user.username}`, tokenData.data);

      // Envie o token para o servidor
      await fetch(`${API_URL}/salvar-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          cargo:user.cargo,
          pushToken: tokenData.data
        })
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }
    }

    getToken();
  }, [user]); // Executa só depois que o usuário for carregado

  return <Telas />;
}
