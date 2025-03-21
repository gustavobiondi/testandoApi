import React, { useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet,KeyboardAvoidingView } from 'react-native';
import { UserContext } from '../UserContext'; // Import the context
import AsyncStorage from '@react-native-async-storage/async-storage';

export default class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      senha: '',
      isloggedIn:false,
      loading:true,
    };
  }

  static contextType = UserContext; // Assign contextType to access context

   // Verifica se o usuario ja esta logado ao abrir o app
   async componentDidMount() {
    const username = await AsyncStorage.getItem('username');
    const token = await AsyncStorage.getItem('userToken');
    const senha = await AsyncStorage.getItem('usersenha');
    const senhaExpiration = await AsyncStorage.getItem('senhaExpiration');

   if (token && username && senha && senhaExpiration) {
        const currentTime = Date.now();

        if (currentTime < parseInt(senhaExpiration)) {
            // Senha ainda valida, fazer login automatico
            this.setState({username,senha,isloggedIn: true }, () => {
              this.mandarValores(username,senha);
            });
        } else {
            //  Senha expirada, remover do AsyncStorage
            await AsyncStorage.removeItem('usersenha');
            await AsyncStorage.removeItem('senhaExpiration');
            console.log("Senha removida automaticamente apos expiracao.");
            this.setState({ isloggedIn: false });
        }
    } else {
        this.setState({ isloggedIn: false });
    }

    this.setState({ loading: false });
}

  // cria e armazena o token//
   login = async() =>{
    const expirationTime = Date.now() + 14 * 60 * 60 * 1000; // Expira em 14 horas
    const guardar_token = this.generateToken()
    await AsyncStorage.setItem('userToken',guardar_token);
    await AsyncStorage.setItem('username', this.state.username);
    await AsyncStorage.setItem('usersenha', this.state.senha);
    await AsyncStorage.setItem('senhaExpiration', expirationTime.toString()); // Salva a expiracao da senha
    this.setState({ isloggedIn: true });
   }

   //gera um token aleatorio//
    generateToken = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
};

  mandarValores(username, senha) {
    fetch('https://flask-backend-server-yxom.onrender.com/verificar_username', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        senha: senha,
      }),
    })
      .then((response) => response.json()) // Convert response to JSON
      .then((data) => {
        if (data.data) {
          // Se o backend retornar True, update the user context
          const { setUser } = this.context; // Access setUser from context
          setUser({ username: this.state.username, cargo: data.cargo });
          if (!this.state.isloggedIn){
            this.login()
          }
          // Update the global user state
        } else {
          alert('Usuario ou senha invalidos');
        }
      })
      .catch((error) => {
        console.error('Erro:', error);
      });
  }

  render() {
    if(this.state.isloggedIn){
      return(
      <View></View>
      )
    }
    else{
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        <KeyboardAvoidingView  behavior='padding'>
        <TextInput
          style={styles.input}
          placeholder="Usuario"
          value={this.state.username}
          onChangeText={(username) => this.setState({ username })}
        />
        <TextInput
        style={styles.input}
          secureTextEntry={true}
          placeholder="Senha"
          value={this.state.senha}
          onChangeText={(senha) => this.setState({ senha })}
        />
        <Button
          title="Entrar"
          onPress={() => this.mandarValores(this.state.username, this.state.senha)}
        />
        </KeyboardAvoidingView>
      </View>
    );
  }}
  }


const styles = StyleSheet.create({
  container: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 50,
    borderRadius: 5,
    marginBottom: 10,
  },
}); 