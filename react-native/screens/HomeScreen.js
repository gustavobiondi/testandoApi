import React from 'react';
import { StyleSheet, View, Button, KeyboardAvoidingView, TextInput, Picker, FlatList, TouchableOpacity, Text } from 'react-native';
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
      pedido_filtrado: [],
      quantidadeSelecionada:[],
      pedidos_Selecionados:[],
      showPedido: false,
      showQuantidade: false,
      quantidade: 1,
    };
  }

  componentDidMount() {
    // Conectar ao servidor Socket.IO
    this.socket = io('http://127.0.0.1:5000');

    // Ouvir eventos de dados iniciais
    this.socket.on('dados_atualizados', ({dados}) => {
      this.setState({ data: dados });
    });



    // Ouvir preço calculado
    this.socket.on('preco', ( data ) => {
      this.setState({ preco: data.preco });
    });

    // Ouvir erros
    this.socket.on('error', ({ message }) => {
      console.error('Erro do servidor:', message);
    });

    // Ouvir o retorno do servidor para o pedido
    this.socket.on('pedidos', (res) => {
      this.setState({
        pedido_filtrado: res,
      });
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
    if (pedido === ''){
      this.setState({ pedido, showPedido:false})
    }
    else{
      this.setState({pedido, showPedido: true });
    }
  
    // Emitir o evento de pesquisa
    this.socket.emit('pesquisa', pedido);
  };
  
  changeFcomanda = (fcomanda) => {
    this.setState({ fcomanda });
  }

  changeCategoria = (categoria) => {
    this.setState({ categoria });
  }

  sendData = () => {
    const { comand, pedidosSelecionados, quantidadeSelecionada } = this.state;
    if (comand && pedidosSelecionados && quantidadeSelecionada) {
      this.socket.emit('insert_order', { comanda: comand, pedidosSelecionados, quantidadeSelecionada});
      this.setState({
        comand: '',
        pedido: '',
        pedidosSelecionados:[],
        quantidadeSelecionada:[],
        quantidade:1,
        showQuantidade:false,
      });
    } else {
      console.warn('Por favor, preencha todos os campos.');
    }
  }

  //INSERIR E FECHAR COMANDA
  getCardapio = () => {
    const { fcomanda } = this.state;
    if (fcomanda) {
        console.log('Enviando comanda:', fcomanda);
        this.socket.emit('get_cardapio', { fcomanda });

        this.socket.on('preco', ( data )  => {
            this.props.navigation.navigate('ComandaScreen', {
                data: data.dados,
                fcomanda: this.state.fcomanda,
                preco: data.preco,
            });
        });
    } else {
        console.warn('Por favor, insira a comanda.');
    }
}


pagarParcial = () => {
  const { valor_pago, fcomanda, preco } = this.state;
  const valorNum = parseFloat(valor_pago);
  
  if (!isNaN(valorNum) && valorNum > 0 && valorNum <= preco) {
    this.socket.emit('pagar_parcial', { valor_pago: valorNum, fcomanda: fcomanda });
    
    this.setState((prevState) => ({
      preco: prevState.preco - valorNum,
      valor_pago: ''
    }));
  } else {
    console.warn('Insira um valor válido para pagamento parcial.');
  }
}


  //SELECIONA O PEDIDO
  selecionarPedido = (pedido) => {
    this.setState({
      pedido: pedido,
      pedido_filtrado: [],
      showQuantidade:true,
    });
//ESCOLHER ESPECIFICAÇÃO E SELECIONAR QUANTIDADE
    
  }

  aumentar_quantidade= () =>{
    this.setState(prevState => ({
        quantidade: prevState.quantidade + 1
    }))
    
}

diminuir_quantidade= () =>{
        this.setState(prevState => ({
            quantidade: prevState.quantidade - 1
        }))
    }

mudar_quantidade = (quantidade) =>{
    this.setState({
      quantidade: quantidade
      })
    }

adicionarPedido = () => {
  const {pedido,quantidade} = this.state
  this.setState(prevState => ({
    pedidosSelecionados: prevState.pedidosSelecionados ? [...prevState.pedidosSelecionados, pedido] : [pedido],
    quantidadeSelecionada: prevState.quantidadeSelecionada ? [...prevState.quantidadeSelecionada, quantidade] : [quantidade],
    quantidade: 1,
    showQuantidade: false,
    pedido: ''
  }));
  
}
    


  render() {
      return (
        <View style={styles.container}>
          <KeyboardAvoidingView behavior="padding" style={{ width: '80%' }}>
            <TextInput //MOSTRA NA TELA "DIGITE O PEDIDO"
              placeholder="Digite o pedido"
              onChangeText={this.changePedido}
              value={this.state.pedido}
              style={styles.input}
            />
            <Button title='Adicionar' onPress={this.adicionarPedido}/>
            {this.state.showPedido && (
            <FlatList //MOSTRAR PEDIDOS DA PESQUISA
              data={this.state.pedido_filtrado}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.itemContainer}
                  onPress={() => this.selecionarPedido(item)}
                >
                  <Text>{item}</Text>
                </TouchableOpacity>
              )}
            />
            )}
            {this.state.showQuantidade && (
            <View          //MOSTRAR QUANTIDADE
            >
            < Button
              title= '-'
              onPress={this.diminuir_quantidade}
              />
              < TextInput
              value={this.state.quantidade}
              onChangeText={this.mudar_quantidade}
              />
              < Button
              title= '+'
              onPress={this.aumentar_quantidade}
              />
              </View>
            )}
            <TextInput //DIGITAR COMANDA DO PEDIDO FEITO
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
          <Button title="Enviar pedido" onPress={this.sendData} // BOTÃO DE ENVIAR PEDIDO
          />
          <TextInput //ESCOLHER COMANDA QUE QUER FECHAR
            placeholder="Qual comanda?"
            onChangeText={this.changeFcomanda}
            value={this.state.fcomanda}
            style={[styles.input, { marginTop: 20 }]}
          />  
          <Button title="Abrir comanda" onPress={this.getCardapio} //BOTÃO QUE VAI FECHAR A COMANDA 
          />
        </View>
      );
    }}

const styles = StyleSheet.create({
  container: { // ESTILO GERAL
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  input: { //ESTILO QUE A GENTE DIGITA
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  itemContainer: { // ESTILO DA DOS PEDIDOS DA BARRA DE PESQUISA
    padding: 10,
    backgroundColor: 'white',
    marginBottom: 5,
    borderRadius: 5,
  },
});