import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import BarmanScreen from './screens/BarmanScreen';
import Cozinha from './screens/CozinhaScreen';
import ComandaScreen from './screens/ComandaScreen';

// Criando os navegadores
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Stack Navigator para as telas relacionadas à Home (incluindo a ComandaScreen)
function HomeStack() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ComandaScreen" component={ComandaScreen} />
    </Stack.Navigator>
  );
}

// Configuração do Drawer Navigator
export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Home">
        {/* Use o Stack Navigator dentro da tela Home */}
        <Drawer.Screen name="Home" component={HomeStack} />
        <Drawer.Screen name="Barman" component={BarmanScreen} />
        <Drawer.Screen name="Cozinha" component={Cozinha} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
