import React from 'react';
import { FlatList,ScrollView, View, Text, StyleSheet, Button, TextInput, TouchableOpacity, KeyboardAvoidingView} from 'react-native';
import io from 'socket.io-client';
import { getCurrentTime } from './HomeScreen';
import { API_URL } from "./url";


class ComandaScreen extends React.Component {
  

  constructor(props) {
    super(props);
    const { data, fcomanda, preco,preco_total,preco_pago,username,nomes,ordem} = this.props.route.params;
    this.state = {
      username,
      data,
      dataGeral:data, 
      fcomanda,
      preco,
      preco_total,
      preco_pago,
      ordem,
      valor_pago: '', // Valor inicial vazio para garantir um controle adequado
      guardarValores:[],
      showBotoes:false,
      showDez:null,
      Brinde:'',
      ShowBrinde:false,
      nomes,
      brindeFiltrado:[],
      itensAlterados:[],
    };
  }

  componentDidMount() {
    console.log(this.state.nomes)
    console.log(this.state.fcomanda)
   

    this.socket = io(`${API_URL}`);


    // Adicionar novo pedido ou atualizar a quantidade e preço do existente

    this.socket.on('preco', ( data ) => {
     
      console.log(data.dados)
      if (data.comanda === this.state.fcomanda){

       if (data.nomes){
        console.log(data.nomes)
        this.setState({nomes:data.nomes})
       }
       
      this.setState({ data: data.dados, dataGeral:data.dados ,preco:data.preco_a_pagar,preco_pago:data.preco_pago,preco_total:data.preco_total });
      
      }
    });
    
  

    this.socket.on('comanda_deleted', ({ fcomanda }) => {
      if (fcomanda === this.state.fcomanda) {
        this.setState({ data: [],dataGeral:[], nomes:[],preco: 0,preco_total:0,preco_pago:0 });
      }
    });

    this.socket.on('error', ({ message }) => {
      console.error('Erro do servidor:', message);
    });
  }

  

  componentWillUnmount() {
    this.socket.off('preco')
    this.socket.off('comanda_deleted')
    this.socket.off('error')
  }


  apagarComanda = () => {
    
    const { fcomanda,preco } = this.state;
    this.socket.emit('delete_comanda', { fcomanda: fcomanda, valor_pago:preco });
    this.socket.emit('faturamento')
    this.setState({showDez:false,nomes:[]})
    
  }

  changeValor = (valor_pago) => {
    this.setState({ valor_pago });
  }

  pagarParcial = () => {
    const { valor_pago, fcomanda, preco } = this.state;
    const valorNum = parseFloat(valor_pago);
    console.log('entrou pagar parcial')
    if (!isNaN(valorNum) && valorNum > 0 && valorNum <= preco) {
      console.log('entrou no if')
      this.socket.emit('faturamento')
      this.socket.emit('pagar_parcial', { valor_pago: valorNum, fcomanda: fcomanda });
      this.setState((prevState) => ({
        preco: prevState.preco - valorNum,
        valor_pago: ''
      }));
    } else {
      console.warn('Insira um valor válido para pagamento parcial.');
    }
  }

  aparecerBotoes = () =>{
    const copia_valores = JSON.parse(JSON.stringify(this.state.data))
    this.setState({
      guardarValores:copia_valores,
      showBotoes:true
    })

  }


    apagarPedidos = (index) => {
      const dataAtualizada = [...this.state.data];
      // Fazendo uma cópia profunda do objeto no índice
      const itemAtualizado = { ...dataAtualizada[index] };
      const preco_u =parseFloat(itemAtualizado.preco)/parseFloat(itemAtualizado.quantidade)
      itemAtualizado.preco = (parseFloat(itemAtualizado.preco)-preco_u).toString()
      itemAtualizado.quantidade = (parseInt(itemAtualizado.quantidade) - 1).toString();
      
      dataAtualizada[index] = itemAtualizado; // Substitui o item no array
      this.setState({ data: dataAtualizada });
      this.atualizarItensAlterados(itemAtualizado);
  };

  adicionarPedidos = (index) => {
      const dataAtualizada = [...this.state.data];
      // Fazendo uma cópia profunda do objeto no índice
      const itemAtualizado = { ...dataAtualizada[index] };
      const preco_u =parseFloat(itemAtualizado.preco)/parseFloat(itemAtualizado.quantidade)
      itemAtualizado.preco = (parseFloat(itemAtualizado.preco)+preco_u).toString()
      itemAtualizado.quantidade = (parseInt(itemAtualizado.quantidade) + 1).toString();
      dataAtualizada[index] = itemAtualizado; // Substitui o item no array
      this.setState({ data: dataAtualizada });
      this.atualizarItensAlterados(itemAtualizado);
  };


  atualizarItensAlterados = (itemAtualizado) => {
    this.setState((prevState) => {
      const pedidoNaLista = prevState.itensAlterados.some(
        (item) => item.pedido === itemAtualizado.pedido && parseFloat(item.preco)/parseFloat(item.quantidade)===parseFloat(itemAtualizado.preco)/parseFloat(itemAtualizado.quantidade));

      const itensAlteradosAtualizados = pedidoNaLista
        ? prevState.itensAlterados.map((item) =>
            item.pedido === itemAtualizado.pedido ? itemAtualizado : item
          )
        : [...prevState.itensAlterados, itemAtualizado];

      return { itensAlterados: itensAlteradosAtualizados };
    });
  };

  changeBrinde = (pedido) => {
    if (!pedido){
      this.setState({brindeFiltrado:[]})
    }
    this.setState({ Brinde:pedido});
    if (pedido) {
      fetch(`${API_URL}/changeBrinde`,{
        method:'POST',
        headers:{
          'Content-Type': 'application/json'
        },
        body:JSON.stringify({
          pedido,
        })
      }).then(resp=>resp.json())
      .then(data=>{
        console.log(data)
        if (data){
          this.setState({brindeFiltrado:data.data})
        }
      }).catch(error => console.error('Erro ao buscar brinde:', error))
    }
  };
  selecionar = (pedido) => {
    this.setState({ Brinde:pedido, brindeFiltrado: []});
  };

  cancelar = () =>{
    const {guardarValores} = this.state
    this.setState({
      data:guardarValores,
      showBotoes:false,
    })
  }
  
  confirmar = () => {
    const { itensAlterados, fcomanda} = this.state;
    this.socket.emit('atualizar_comanda', { itensAlterados:itensAlterados, comanda:fcomanda });
    this.setState({ showBotoes: false, itensAlterados: [] });
  };
  
  confirmarBrinde = () =>{
    const {fcomanda, Brinde,username} = this.state
    const horario = new Date().toTimeString().slice(0, 5);
    console.log(Brinde)
    console.log(horario)
    this.socket.emit('insert_order',{'comanda':fcomanda,'pedidosSelecionados':[Brinde],
      'quantidadeSelecionada':[1],'preco':true,'username':username,'horario':horario,'extraSelecionados':['']})
    this.setState({Brinde:'',ShowBrinde:false})
  }

  atualizarOrdem = (sinal,ordem) =>{
    if (sinal==='-' && this.state.ordem>0){

      this.setState({
        ordem:ordem-1
      })
      fetch(`${API_URL}/pegar_pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comanda: this.state.fcomanda,
          ordem: ordem-1,
        })
      })
        .then(resp => resp.json()) // Garante que resp.json() seja retornado
        .then(data => {
          if(data){
          this.setState({ data:data.data,dataGeral:data.data,preco:data.preco });
        console.log(data) 
          }
        })
        .catch(error => console.error('Erro ao buscar pedidos:', error));
    }
    else if (sinal === '+'){
 
      this.setState({
        ordem:ordem+1
      })
      fetch(`${API_URL}/pegar_pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comanda: this.state.fcomanda,
          ordem: ordem+1,
        })
      })
        .then(resp => resp.json()) // Garante que resp.json() seja retornado
        .then(data => {
          if (data){
          this.setState({ data:data.data,dataGeral:data.data,preco:data.preco });}
    })
        .catch(error => console.error('Erro ao buscar pedidos:', error));
    }
  }

  desfazerPagamento =() =>{
        this.socket.emit('desfazer_pagamento',{comanda:this.state.fcomanda,preco:this.state.preco,ordem:this.state.ordem})
  }

  dataComnpleto = () =>{
    this.setState({data:this.state.dataGeral})
  }

  filtrarPorNome(nome){
    this.setState({
      data: this.state.dataGeral.filter(item=>item.nome===nome)
    })
  }


  render() {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text>Comanda {this.state.fcomanda}</Text>
          <Button title='<' onPress={() => this.atualizarOrdem('+', this.state.ordem)} />
          <Text>{this.state.ordem}</Text>
          <Button title='>' onPress={() => this.atualizarOrdem('-', this.state.ordem)} />
          {!this.state.showBotoes ? (
            <Button title='editar' onPress={this.aparecerBotoes} />
          ) : (
            <View style={styles.tableRow}>
              <Button title='Cancelar' color={'red'} onPress={this.cancelar} />
              <Button title='Confirmar' onPress={this.confirmar} />
            </View>
          )}
        </View>

        {this.state.nomes.length > 0 && this.state.ordem === 0 && (
          <View style={styles.nomeRow}>
            <Button title="Geral" onPress={this.dataComnpleto} />
            {this.state.nomes.map((item, index) => (
              <View key={index} style={styles.nomeButtonWrapper}>
                <Button title={item.nome} onPress={() => this.filtrarPorNome(item.nome)} />
              </View>
            ))}
            <Button title='Sem Nome' color={'orange'} onPress={() => this.filtrarPorNome('-1')} />
          </View>
        )}

        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Pedido</Text>
          <Text style={styles.headerText}>Quant</Text>
          <Text style={styles.headerText}>Valor</Text>
        </View>

        <ScrollView >
          {this.state.data.length > 0 && this.state.data.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.itemText}>{item.pedido} {item.extra}</Text>
              <Text style={styles.itemText}>{item.quantidade}</Text>
              <Text style={styles.itemText}>{item.preco}</Text>
              {this.state.showBotoes && (
                <View style={styles.buttonRow}>
                  <Button title='-' color={'red'} onPress={() => this.apagarPedidos(index)} />
                  <Button title='+' onPress={() => this.adicionarPedidos(index)} />
                </View>
              )}
            </View>
          ))}
        </ScrollView>
        
        {this.state.ordem === 0 ? (
          <View >
          {!this.state.ShowBrinde ? (
                  <Button title='Adicionar Brinde' color={'green'} onPress={() => this.setState({ ShowBrinde: true })} />
                ) : (
                  <View>
                    <View style={styles.buttonBrindeRow}>
                      <TextInput
                        placeholder='Brinde'
                        onChangeText={this.changeBrinde}
                        value={this.state.Brinde}
                        style={styles.input}
                      />
                      <Button title='OK' onPress={this.confirmarBrinde} />
                    </View>
                    {this.state.brindeFiltrado && this.state.brindeFiltrado.map((item, index) => (
                      <TouchableOpacity key={index} style={styles.brindeContainer} onPress={() => this.selecionar(item)}>
                        <Text style={styles.brindeText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
          <View style={styles.summaryBox}>
            <View style={styles.paymentRow}>
              <View style={styles.paymentBlock}>
                <Text style={styles.totalText}>Valor Pago</Text>
                <Text style={styles.totalValue}>{this.state.preco_pago}</Text>
              </View>
              <View style={styles.paymentBlock}>
                <Text style={styles.totalText}>Valor a Pagar</Text>
                <Text style={styles.totalValue}>{this.state.preco}</Text>
              </View>
              <View style={styles.paymentBlock}>
                <Text style={styles.totalText}>Valor Total</Text>
                <Text style={styles.totalValue}>{this.state.preco_total}</Text>
              </View>
            </View>

            <View style={styles.actionsBox}>

              <View style={styles.parcialRow}>
                <TextInput
                  placeholder="Quanto?"
                  onChangeText={this.changeValor}
                  value={this.state.valor_pago}
                  keyboardType="numeric"
                  style={styles.input}
                />
                <Button title='Pagar Parcial' onPress={this.pagarParcial} />
              </View>
            </View>
            <View style={styles.buttonRow}>
                <Button style={styles.tudopagostyle} title='Tudo Pago' onPress={this.apagarComanda} />
                {!this.state.showDez ? (
                  <Button style={styles.buttom10} title='10%' onPress={() => this.setState(prevState => ({ preco: Math.floor(prevState.preco * 1.1), showDez: prevState.preco }))} />
                ) : (
                  <Button title='X' color={'red'} onPress={() => this.setState(prevState => ({ preco: prevState.showDez, showDez: null }))} />
                )}
              </View>
          </View>
          </View>
        ) : (
          <View>
            {this.state.ordem === 1 && this.state.data ? (
              <Button title='Desfazer Pagamento' onPress={this.desfazerPagamento} />
            ) : (
              <Text>não é possivel desfazer o pagamento</Text>
            )}
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nomeRow: {
    flexDirection: 'row',
  },
  nomeButtonWrapper: {
    flexDirection: 'row',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
    backgroundColor: '#f7f7f7',
  },
  headerText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    textAlign: 'center',
  },
  summaryBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 0,
  },
  paymentBlock: {
    alignItems: 'center',
  },
  totalText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  totalValue: {
    fontSize: 24,
    marginVertical: 10,
    textAlign: 'center',
  },
  actionsBox: {
  },
  parcialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop:15,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginVertical: 10,
    width: '60%',
    alignSelf: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom:30,
    marginTop:25,
  
  },
  buttonbrindeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom:30,
    marginTop:15,
  },
  tudopagostyle:{
   width:80,
   height:35, 
  },
  buttom10:{

  },
  brindeContainer: {
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#e0e0e0',
    marginVertical: 5,
    borderRadius: 5,
  },
  brindeText: {
    fontSize: 20,
  },
});
export default ComandaScreen;
