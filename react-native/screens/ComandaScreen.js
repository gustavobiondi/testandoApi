import React from 'react';
import { FlatList,ScrollView, View, Text, StyleSheet, Button, TextInput, TouchableOpacity, KeyboardAvoidingView} from 'react-native';

import io from 'socket.io-client';
import { getCurrentTime } from './HomeScreen';


class ComandaScreen extends React.Component {
  

  constructor(props) {
    super(props);
    const { data, fcomanda, preco,preco_total,preco_pago,username,nomes} = this.props.route.params;
    this.state = {
      username,
      data,
      dataGeral:data, 
      fcomanda,
      preco,
      preco_total,
      preco_pago,
      ordem:0,
      valor_pago: '', // Valor inicial vazio para garantir um controle adequado
      guardarValores:[],
      showBotoes:false,
      showDez:null,
      Brinde:'',
      ShowBrinde:false,
      nomes,
      brindeFiltrado:[],
      
    };
  }

  componentDidMount() {
    console.log(this.state.nomes)
    console.log(this.state.fcomanda)
   

    this.socket = io('http://192.168.15.16:5000');


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


  apagarPedidos = (index)=>{
    this.setState(prevState=>{
      const quantidadeAtualizada = prevState.data
      quantidadeAtualizada[index]['quantidade']-=1
      return{
        data:quantidadeAtualizada
      }
    })
  }
  
  adicionarPedidos = (index)=>{
    this.setState(prevState=>{
      const quantidadeAtualizada = prevState.data
      quantidadeAtualizada[index]['quantidade']+=1
      return{
        data:quantidadeAtualizada
      }
    })
  }
  changeBrinde = (pedido) => {
    this.setState({ Brinde:pedido});
    if (pedido) {
      fetch('http://192.168.15.16:5000/changeBrinde',{
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
  
  confirmar = () =>{
    const {fcomanda,data} = this.state
    this.socket.emit('atualizar_comanda',{dados:data, comanda:fcomanda})
    this.setState({
      showBotoes:false,
    })
  }

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
      if (ordem-1===1){
        this.setState({showPagamento:false})
      }
      this.setState(prevState=>({
        ordem:ordem-1
      }))
      fetch('http://192.168.15.16:5000/pegar_pedidos', {
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
          this.setState({ data:data.data,dataGeral:data.data,preco:data.preco });
        console.log(data)  
        })
        .catch(error => console.error('Erro ao buscar pedidos:', error));
    }
    else if (sinal === '+'){
      if (ordem+1===1){
        this.setState({showPagamento:false})
      }
      this.setState(prevState=>({
        ordem:ordem+1
      }))
      fetch('http://192.168.15.16:5000/pegar_pedidos', {
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
          this.setState({ data:data.data,dataGeral:data.data,preco:data.preco });})
        .catch(error => console.error('Erro ao buscar pedidos:', error));
    }
  }

  desfazerPagamento =() =>{
    this.setState({ordem:0})
    this.socket.emit('desfazer_pagamento',{comanda:this.state.fcomanda,preco:this.state.preco})
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
      <ScrollView style={styles.container}>
        {/* Header da comanda e botões de ordem */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between',alignItems:'center' }}>
          <Text>Comanda {this.state.fcomanda}</Text>
            <Button title='<' onPress={() => this.atualizarOrdem('+', this.state.ordem)} />
            <Text>{this.state.ordem}</Text>
            <Button title='>' onPress={() => this.atualizarOrdem('-', this.state.ordem)} />
            {!this.state.showBotoes && (
          <Button title='editar' onPress={this.aparecerBotoes}/>
          )}
          {this.state.showBotoes && (
            <View style={styles.tableRow}>
            <Button title='Cancelar' color={'red'} onPress={this.cancelar}/>
            <Text>    </Text>
            <Button title='Confirmar' onPress={this.confirmar} />
            </View>
          )}
        </View>
          
        {this.state.nomes.length > 0 && this.state.ordem === 0 && (
        <View style={{flexDirection: 'row'}}>
          <Button title="Geral" onPress={this.dataComnpleto} />
          {this.state.nomes.map((item, index) => (
            <View key={index} style={{flexDirection: 'row'}}>
              <Text>  </Text>
              <Button title={item.nome} onPress={() => this.filtrarPorNome(item.nome)} />
            </View>
          ))}
          <Text>  </Text>
          <Button title='Sem Nome' color={'orange'} onPress={() => this.filtrarPorNome('-1')} />
        </View>
        )}


  
        {/* Tabela de pedidos */}
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Pedido</Text>
          <Text style={styles.headerText}>Quant</Text>
          <Text style={styles.headerText}>Valor</Text>
        </View>
        
        {this.state.data.map((item,index)=>(
          <View key={index} style={styles.tableRow}>
          <Text style={styles.itemText}>{item.pedido}</Text>
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


  
        {/* Resumo e opções de pagamento */}
        {this.state.ordem === 0 ? (
          <View style={styles.summary}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.totalText}>PREÇO_PAGO</Text>
                <Text style={styles.totalValue}>{this.state.preco_pago}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.totalText}>PRECO A PAGAR</Text>
                <Text style={styles.totalValue}>{this.state.preco}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.totalText}>PREÇO TOTAL</Text>
                <Text style={styles.totalValue}>{this.state.preco_total}</Text>
              </View>
            </View>
  
            <View style={styles.buttonRow}>
              <View>
            {!this.state.ShowBrinde ? (
              <View>
              <View style={styles.buttonRow}>
              <Button title='Tudo Pago' onPress={this.apagarComanda} />

              {!this.state.showDez ? (
                <Button title='10%' onPress={() => this.setState(prevState => ({ preco: Math.floor(prevState.preco * 1.1), showDez: prevState.preco }))} />
              ) : (
                <Button title='X' color={'red'} onPress={() => this.setState(prevState => ({ preco: prevState.showDez, showDez: null }))} />
              )}
                </View>
                <Button title='Adicionar Brinde' color={'green'} onPress={() => this.setState({ ShowBrinde: true })} />
                </View>
              ):(

                <View style={styles.buttonRow}>
                  <TextInput
                    placeholder='Brinde'
                    onChangeText={this.changeBrinde}
                    value={this.state.Brinde}
                    style={styles.input}
                  />
                  {this.state.brindeFiltrado && this.state.brindeFiltrado.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.brindeContainer} onPress={() => this.selecionar(item)}>
                      <Text style={styles.brindeText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                  <Button title='OK' onPress={this.confirmarBrinde} />
                </View>
              )}
            </View>
            </View>
            <KeyboardAvoidingView behavior='padding' >
            <View style={{flexDirection:'row'}}>
            <TextInput
              placeholder="Quanto?"
              onChangeText={this.changeValor}
              value={this.state.valor_pago}
              keyboardType="numeric"
              style={styles.input}
            />
            <Button title='Pagar Parcial' onPress={this.pagarParcial} />
            </View>
            </KeyboardAvoidingView>
          </View>
        ) : (
          this.state.ordem === 1 && this.state.data && <Button title='Desfazer Pagamento' onPress={this.desfazerPagamento} />
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
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
    fontSize: 10,
    textAlign: 'center',
  },
  summary: {
    marginTop: 20,
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
    alignItems: 'center',
    padding: 10,
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