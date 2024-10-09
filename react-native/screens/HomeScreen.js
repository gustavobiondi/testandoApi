import React from 'react';
import {ScrollView, StyleSheet, View, Button, KeyboardAvoidingView, TextInput, Picker, FlatList, TouchableOpacity, Text } from 'react-native';
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
      quantidadeSelecionada: [],
      pedidosSelecionados: [],
      showPedido: false,
      showQuantidade: false,
      showPedidoSelecionado: false,
      quantidade: 1,
    };
  }

  componentDidMount() {
    // Conectar ao servidor Socket.IO
    this.socket = io('http://127.0.0.1:5000');

    // Ouvir eventos de dados iniciais
    this.socket.on('dados_atualizados', ({ dados }) => {
      this.setState({ data: dados });
    });

    // Ouvir preço calculado
    this.socket.on('preco', (data) => {
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
    this.socket.off('dados_atualizados');
    this.socket.off('preco');
    this.socket.off('error');
    this.socket.off('pedidos');
  }

  changeComanda = (comand) => {
    this.setState({ comand });
  };

  changePedido = (pedido) => {
    this.setState({ pedido });
    if (pedido) {
      this.setState({ showPedido: true });
    }
    else{
      this.setState({showPedido:false})
    }

    if (pedido) {
      this.socket.emit('pesquisa', pedido);
    }
  };

  changeFcomanda = (fcomanda) => {
    this.setState({ fcomanda });
  };

  changeCategoria = (categoria) => {
    this.setState({ categoria });
  };

  sendData = () => {
    const { comand, pedidosSelecionados, quantidadeSelecionada, pedido, quantidade } = this.state;
  
    // Função para pegar o horário atual formatado (HH:mm)
    const getCurrentTime = () => {
      const now = new Date();
  
      // Formatação de hora: HH:mm
      const time = String(now.getHours()).padStart(2, '0') + ':' + 
                   String(now.getMinutes()).padStart(2, '0');
  
      return time;
    };
  
    const currentTime = getCurrentTime();
  
    if (comand && pedidosSelecionados.length && quantidadeSelecionada.length) {
      this.socket.emit('insert_order', { 
        comanda: comand, 
        pedidosSelecionados, 
        quantidadeSelecionada,
        horario: currentTime  // Enviando apenas a hora e o minuto
      });
      
      this.setState({
        comand: '',
        pedido: '',
        pedidosSelecionados: [],
        quantidadeSelecionada: [],
        quantidade: 1,
        showQuantidade: false,
        showPedidoSelecionado: false,
      });
    } else if (comand && pedido && quantidade) {
      this.socket.emit('insert_order', { 
        comanda: comand, 
        pedidosSelecionados: [pedido], 
        quantidadeSelecionada: [quantidade], 
        horario: currentTime  // Enviando apenas a hora e o minuto
      });
  
      this.setState({
        comand: '',
        pedido: '',
        quantidade: 1,
        showQuantidade: false,
        showPedidoSelecionado: false,
      });
    } else {
      console.warn('Por favor, preencha todos os campos.');
    }
  };
  
  

  getCardapio = () => {
    const { fcomanda } = this.state;
    if (fcomanda) {
      console.log('Enviando comanda:', fcomanda);
      this.socket.emit('get_cardapio', { fcomanda });

      this.socket.on('preco', (data) => {
        this.props.navigation.navigate('ComandaScreen', {
          data: data.dados,
          fcomanda: this.state.fcomanda,
          preco: data.preco,
        });
      });
    } else {
      console.warn('Por favor, insira a comanda.');
    }
  };

  pagarParcial = () => {
    const { valor_pago, fcomanda, preco } = this.state;
    const valorNum = parseFloat(valor_pago);

    if (!isNaN(valorNum) && valorNum > 0 && valorNum <= preco) {
      this.socket.emit('pagar_parcial', { valor_pago: valorNum, fcomanda: fcomanda });

      this.setState((prevState) => ({
        preco: prevState.preco - valorNum,
        valor_pago: '',
      }));
    } else {
      console.warn('Insira um valor válido para pagamento parcial.');
    }
  };

  selecionarPedido = (pedido) => {
    this.setState({
      pedido: pedido,
      pedido_filtrado: [],
      showQuantidade: true,
    });
  };

  aumentar_quantidade = () => {
    this.setState((prevState) => ({
      quantidade: prevState.quantidade + 1,
    }));
  };

  diminuir_quantidade = () => {
    this.setState((prevState) => ({
      quantidade: prevState.quantidade - 1,
    }));
  };

  mudar_quantidade = (quantidade) => {
    this.setState({
      quantidade: parseInt(quantidade) || 1, // Garante que a quantidade seja um número inteiro
    });
  };

  adicionarPedido = () => {
    const { pedido, quantidade } = this.state;
    this.setState((prevState) => ({
      pedidosSelecionados: [...prevState.pedidosSelecionados, pedido],
      quantidadeSelecionada: [...prevState.quantidadeSelecionada, quantidade],
      quantidade: 1,
      showQuantidade: false,
      pedido: '',
      showPedidoSelecionado: true,
      showPedido:false
    }));
  };

  removerPedidoSelecionado = (index) => {
    this.setState((prevState) => {
      const quantidadeAtualizada = [...prevState.quantidadeSelecionada];

      if (quantidadeAtualizada[index] > 1) {
        quantidadeAtualizada[index] -= 1;
        return { quantidadeSelecionada: quantidadeAtualizada };
      } else {
        quantidadeAtualizada.splice(index, 1);
        const pedidosAtualizados = prevState.pedidosSelecionados.filter((item, i) => i !== index);
        return { pedidosSelecionados: pedidosAtualizados, quantidadeSelecionada: quantidadeAtualizada };
      }
    });
  };

  adicionarPedidoSelecionado = (index) => {
    this.setState((prevState) => {
      const quantidadeAtualizada = [...prevState.quantidadeSelecionada];
      quantidadeAtualizada[index] += 1;
      return { quantidadeSelecionada: quantidadeAtualizada };
    });
  };

  render() {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <View style={[styles.itemContainer, { flexDirection: 'row'}]}>
              {/* Campo de Comanda (reduzido e à esquerda) */}
              <TextInput
                placeholder="Comanda"
                onChangeText={this.changeComanda}
                value={this.state.comand}
                style={[styles.input, styles.inputComanda]} // Estilo específico para o campo Comanda
              />
              {/* Campo de Pedido (à direita) */}
              <TextInput
                placeholder="Digite o pedido"
                onChangeText={this.changePedido}
                value={this.state.pedido}
                style={[styles.input, styles.inputPedido]}
              />
              {this.state.showQuantidade && (
              <View style={[styles.quantidadeContainer,{ flexDirection: 'row'}]}>
                <Button title="-" onPress={this.diminuir_quantidade} />
                <TextInput style={[styles.input,styles.inputQuantidade]}  value={String(this.state.quantidade)} onChangeText={this.mudar_quantidade} />
                <Button title="+" onPress={this.aumentar_quantidade} />
              </View>
            )}
              <Button   title="Adicionar" onPress={this.adicionarPedido} />
            </View>
  
  
            {this.state.showPedido && (
              <View style={styles.container}>
                <FlatList
                  data={this.state.pedido_filtrado}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.itemContainer} onPress={() => this.selecionarPedido(item)}>
                      <Text>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
  
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
  
            {this.state.showPedidoSelecionado && (
              <View style={styles.pedidosContainer}>
                <FlatList
                  data={this.state.pedidosSelecionados}
                  renderItem={({ item, index }) => (
                    <View style={[styles.itemContainer, styles.pedidoSelecionadoContainer]}>
                      <Text>{item}</Text>
                      <View style={styles.quantidadeContainer}>
                        <Button title="-" color="red" onPress={() => this.removerPedidoSelecionado(index)} />
                        <Text>{this.state.quantidadeSelecionada[index]}</Text>
                        <Button title="+" onPress={() => this.adicionarPedidoSelecionado(index)} />
                      </View>
                    </View>
                  )}
                />
              </View>
            )}
  
            <TextInput
              placeholder="Qual comanda?"
              onChangeText={this.changeFcomanda}
              value={this.state.fcomanda}
              style={[styles.input, { marginTop: 20 }]}
            />
            <Button title="Abrir Comanda" onPress={this.getCardapio} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}
  
  const styles = StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    container: {
      backgroundColor: '#fff',
      alignItems: 'center',
      paddingBottom: 20,
    },
    itemContainer: {
      marginVertical: 10,
    },
    input: {
      borderWidth: 1,
      padding: 8,
      marginTop:8,
      marginBottom: 10,
      borderRadius: 4,
    },
    inputComanda: {
      width: '35%', // Reduz o tamanho da comanda para caber melhor ao lado do pedido
    },
    inputPedido: {
      width: '45%', // Ajusta o tamanho do campo de pedido
    },
    inputQuantidade:{
      width: '16%',
    },
    pedidosContainer: {
      width: '10%', // Limita a largura da lista de pedidos
    },
    pedidoSelecionadoContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between', // Garante que os botões e o texto fiquem alinhados
      alignItems: 'center', // Alinha verticalmente os itens
    },
    botoes:{
      marginTop:10,
    },
    quantidadeContainer: {
      flexDirection: 'row',
      alignItems: 'center', // Alinha verticalmente os botões e o texto
    },
  });
  