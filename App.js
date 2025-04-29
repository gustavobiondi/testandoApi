import 'react-native-reanimated';
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HomeScreen from './screens/HomeScreen.js';
import BarmanScreen from './screens/BarmanScreen.js';
import Cozinha from './screens/CozinhaScreen.js';
import ComandaScreen from './screens/ComandaScreen.js';
import EstoqueScreen from './screens/EstoqueScreen.js';
import EstoqueGeral from './screens/EstoqueGeral.js'; 
import Login from './screens/LoginScreen.js';
import ChoseUser from './screens/ChoseUser.js'; 
import { UserContext, UserProvider } from './UserContext.js'; // Import UserProvider and context
import PedidosScreen from './screens/PedidosScreen.js';
import Analytics from './screens/AnalyticsScreen.js';
import Cadastro from './screens/CadastrarScreen.js';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import verComandas from './screens/Comandas.js';
import Icon from 'react-native-vector-icons/FontAwesome';
import ScreenCardapio from './screens/Cardapio.js';
import coWorksScreen from './screens/coWorksScreen.js';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const TabTop = createMaterialTopTabNavigator();

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();


// Stack Navigator para as telas relacionadas à Home (incluindo a ComandaScreen)
function HomeStack() {
  return (
    
      <Tab.Navigator initialRouteName="home">
        <Tab.Screen 
          name="home" 
          component={HomeScreen} 
          options={{ 
            headerShown: false, 
            tabBarIcon: ({ color, size }) => (
              <Icon name="home" color={color} size={size} /> // Ícone de casinha
            )
          }}
        />
      <Tab.Screen 
        name="comanda" 
        component={Comanda} 
        options={{ 
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="list-alt" color={color} size={size} /> // Ícone de lista
          )
        }} 
      />
    </Tab.Navigator>
  );
}

function AnalytcsStack(){
  return (
    <TabTop.Navigator initialRouteName="Analytics">
      <TabTop.Screen  
        name='Analytics'
        component={Analytics}
        options={{
          headerShown: false
  }}
      />

      <TabTop.Screen
      name='Analise da equipe'
      component={coWorksScreen}
      options={{
        headerShown: false
      }
      }
      />
    </TabTop.Navigator>
  );
}



function Comanda() {
    return (
      <Stack.Navigator initialRouteName="Comandas" options={{ headerShown: false }}>
        <Stack.Screen name="Comandas" component={verComandas} />
        <Stack.Screen name="Comanda" component={ComandaScreen} />
      </Stack.Navigator>
    );
  
  
}


// Defina um componente de navegação condicional
function AuthNavigator() {
  const { user } = useContext(UserContext); 

  if (!user) return null; // Evita erro se user for indefinido

  return (
    <NavigationContainer>
      {user.username ? (
        user.cargo === 'ADM' ? (
          <Drawer.Navigator initialRouteName="Inicio">
            <Drawer.Screen name="Inicio" component={HomeStack} />
            <Drawer.Screen name="Barman" component={BarmanScreen} />
            <Drawer.Screen name="Cozinha" component={Cozinha} />
            <Drawer.Screen name="Pedidos" component={PedidosScreen} />
            <Drawer.Screen name="Cardapio" component={ScreenCardapio}/>
            <Drawer.Screen name="Estoque Carrinho" component={EstoqueScreen} />
            <Drawer.Screen name="Estoque Geral" component={EstoqueGeral} />
            <Drawer.Screen name="AnalyticsStack" component={AnalytcsStack} />
            <Drawer.Screen name="Users" component={ChoseUser} />
            <Drawer.Screen name="Cadastrar" component={Cadastro} />
    
          </Drawer.Navigator>
        ) : (
          <Drawer.Navigator initialRouteName="Home">
            <Drawer.Screen name="Home" component={HomeStack} />
            <Drawer.Screen name="Barman" component={BarmanScreen} />
            <Drawer.Screen name="Cozinha" component={Cozinha} />
            <Drawer.Screen name="Pedidos" component={PedidosScreen} />
            <Drawer.Screen name="Cardapio" component={ScreenCardapio}/>
            <Drawer.Screen name="Estoque" component={EstoqueScreen} />
          </Drawer.Navigator>
        )
      ) : (
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={Login} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <UserProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthNavigator />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </UserProvider>
  );
}
