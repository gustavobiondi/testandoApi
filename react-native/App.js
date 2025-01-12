import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HomeScreen from './screens/HomeScreen';
import BarmanScreen from './screens/BarmanScreen';
import Cozinha from './screens/CozinhaScreen';
import ComandaScreen from './screens/ComandaScreen';
import EstoqueScreen from './screens/EstoqueScreen';
import Login from './screens/LoginScreen';
import ChoseUser from './screens/ChoseUser';
import { UserContext, UserProvider } from './UserContext'; // Import UserProvider and context
import PedidosScreen from './screens/PedidosScreen';
import Analytics from './screens/AnalyticsScreen';
import Cadastro from './screens/CadastrarScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import verComandas from './screens/Comandas';
import Icon from 'react-native-vector-icons/FontAwesome';


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
  const { user } = useContext(UserContext); // Acessa o user do contexto

  return (
    <NavigationContainer>
      {user.username ? (user.cargo==='ADM'?(
        // Se o usuário está logado, mostrar as telas protegidas
        <Drawer.Navigator initialRouteName="Inicio">
          <Drawer.Screen name="Inicio" component={HomeStack} />
          <Drawer.Screen name="Barman" component={BarmanScreen} />
          <Drawer.Screen name="Cozinha" component={Cozinha} />
          <Drawer.Screen name="Pedidos" component={PedidosScreen} />
          <Drawer.Screen name="Estoque" component={EstoqueScreen} />
          <Drawer.Screen name="Analytics" component={Analytics} />
          <Drawer.Screen name="Users" component={ChoseUser} />
          <Drawer.Screen name="Cadastrar" component={Cadastro} />
        </Drawer.Navigator>
      ):(
        <Drawer.Navigator initialRouteName="Home">
          <Drawer.Screen name="Home" component={HomeStack} />
          <Drawer.Screen name="Barman" component={BarmanScreen} />
          <Drawer.Screen name="Cozinha" component={Cozinha} />
          <Drawer.Screen name="Pedidos" component={PedidosScreen} />
          <Drawer.Screen name="Estoque" component={EstoqueScreen} />
        </Drawer.Navigator>
      )): (
        // Se não está logado, mostrar a tela de login
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={Login} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <UserProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthNavigator />
      </GestureHandlerRootView>
    </UserProvider>
  );
}