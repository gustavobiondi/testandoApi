import React from 'react';
import { StyleSheet, View, Button, KeyboardAvoidingView, TextInput, Picker } from 'react-native';
import io from 'socket.io-client';

export default class HomeScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      comand: '',
      pedido: '',
      preco: null,
      data: [],
      fcomanda: '',
      categoria: 'produto',
    };
  }

  componentDidMount() {
    // Conectar ao servidor Socket.IO
    this.socket = io('http://192.168.15.16:5000');

    // Ouvir eventos de dados iniciais
    this.socket.on('initial_data', (dados) => {
      this.setState({ data: dados });
    });

    // Ouvir novos pedidos
    this.socket.on('new_order', (newOrder) => {
      this.setState((prevState) => ({
        data: [...prevState.data, newOrder]
      }));
    });

    // Ouvir comanda deletada
    this.socket.on('comanda_deleted', ({ fcomanda }) => {
      this.setState((prevState) => ({
        data: prevState.data.filter(item => item.comanda !== fcomanda)
      }));
    });

    // Ouvir preço calculado
    this.socket.on('preco', ({ preco }) => {
      this.setState({ preco });
      this.props.navigation.navigate('ComandaScreen', { data: this.state.data, fcomanda: this.state.fcomanda, preco });
    });

    // Ouvir erros
    this.socket.on('error', ({ message }) => {
      console.error('Erro do servidor:', message);
    });
  }

  componentWillUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  changeComanda = (comand) => {
    this.setState({ comand });
  }

  changePedido = (pedido) => {
    this.setState({ pedido });
  }

  changeFcomanda = (fcomanda) => {
    this.setState({ fcomanda });
  }

  changeCategoria = (categoria) => {
    this.setState({ categoria });
  }

  sendData = () => {
    const { comand, pedido, categoria } = this.state;
    if (comand && pedido && categoria) {
      this.socket.emit('insert_order', { comanda: comand, pedido, categoria });
      this.setState({
        comand: '',
        pedido: '',
        categoria: 'produto',
      });
    } else {
      console.warn('Por favor, preencha todos os campos.');
    }
  }

  getCardapio = () => {
    const { fcomanda } = this.state;
    if (fcomanda) {
      this.socket.emit('get_cardapio', { fcomanda });
    } else {
      console.warn('Por favor, insira a comanda.');
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView behavior="padding" style={{ width: '80%' }}>
          <TextInput
            placeholder="Digite o pedido"
            onChangeText={this.changePedido}
            value={this.state.pedido}
            style={styles.input}
          />
          <TextInput
            placeholder="Comanda"
            onChangeText={this.changeComanda}
            value={this.state.comand}
            style={styles.input}
          />
        </KeyboardAvoidingView>
        <Picker
          selectedValue={this.state.categoria}
          onValueChange={this.changeCategoria}
          style={{ width: '80%', marginBottom: 10 }}
        >
          <Picker.Item label="Produto" value="produto" />
          <Picker.Item label="Drink" value="drink" />
          <Picker.Item label="Cozinha" value="cozinha" />
        </Picker>
        <Button title="Enviar pedido" onPress={this.sendData} />
        <TextInput
          placeholder="Qual comanda?"
          onChangeText={this.changeFcomanda}
          value={this.state.fcomanda}
          style={[styles.input, { marginTop: 20 }]}
        />
        <Button title="Fechar comanda" onPress={this.getCardapio} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});
