import React from 'react';
import { FlatList, View, Text, StyleSheet, Button, TextInput, TouchableOpacity} from 'react-native';

import io from 'socket.io-client';


class ComandaScreen extends React.Component {
  constructor(props) {
    super(props);
    const { data, fcomanda, preco,preco_total,preco_pago } = this.props.route.params;
    this.state = {
      data,
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
      brindeFiltrado:[],
    };
  }

  componentDidMount() {
    this.socket = io('http://127.0.0.1:5000');


    // Adicionar novo pedido ou atualizar a quantidade e preço do existente

    this.socket.on('preco', ( data ) => {
      if (data.comanda === this.state.fcomanda){
        if (data.dados){
          data.dados.filter(item=>item.ordem===0)
        }

      this.setState({ data: data.dados, preco:data.preco_a_pagar,preco_pago:data.preco_pago,preco_total:data.preco_total });
      }
    });
    
  

    this.socket.on('comanda_deleted', ({ fcomanda }) => {
      if (fcomanda === this.state.fcomanda) {
        this.setState({ data: [], preco: 0,preco_total:0,preco_pago:0 });
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
    if (this.state.data){
    const { fcomanda,preco } = this.state;
    this.socket.emit('delete_comanda', { fcomanda: fcomanda, valor_pago:preco });
    }
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
      fetch('http://127.0.0.1:5000/changeBrinde',{
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

  atualizarOrdem = (sinal,ordem) =>{
    if (sinal==='-' && this.state.ordem>0){
      if (ordem-1===1){
        this.setState({showPagamento:false})
      }
      this.setState(prevState=>({
        ordem:ordem-1
      }))
      fetch('http://127.0.0.1:5000/pegar_pedidos', {
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
          this.setState({ data:data.data,preco:data.preco });
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
      fetch('http://127.0.0.1:5000/pegar_pedidos', {
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
          this.setState({ data:data.data,preco:data.preco });})
        .catch(error => console.error('Erro ao buscar pedidos:', error));
    }
  }

  desfazerPagamento =() =>{
    this.setState({ordem:0})
    this.socket.emit('desfazer_pagamento',{comanda:this.state.fcomanda,preco:this.state.preco})
  }

  render() {

    return (
      <View style={styles.container}>
        <View style={[styles.container,{flexDirection:'row'}]}>
        <Text>Comanda = {this.state.fcomanda}</Text>
        <Button title='<' onPress={()=>this.atualizarOrdem('+',this.state.ordem)}/>
        <Text>{this.state.ordem}</Text>
        <Button title='>' onPress={()=>this.atualizarOrdem('-',this.state.ordem)}/>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Pedido</Text>
          <Text style={styles.headerText}>Quantidade</Text>
          <Text style={styles.headerText}>Valor</Text>
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

        <FlatList
          data={this.state.data}
          renderItem={({ item,index }) => (
            <View style={styles.tableRow}>
              <Text style={styles.itemText}>{item.pedido}</Text>
              <Text style={styles.itemText}>{item.quantidade}</Text>
              <Text style={styles.itemText}>{item.preco}</Text>
              {this.state.showBotoes && (
                <View style={styles.tableRow}>
                <Button title='-'  color={'red'} onPress={()=>this.apagarPedidos(index)}/>
                <Text>    </Text>
                <Button title='+' onPress={()=>this.adicionarPedidos(index)}/>
                </View>
              )}
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
        {this.state.ordem===0?(
        <View style={styles.summary}>
          <View style={{flexDirection:'row'}}>
            <View style={{paddingHorizontal:30,alignItems:'center'}}>
            <Text style ={styles.totalText}>PREÇO_PAGO</Text>
          <Text style={styles.totalValue}>{this.state.preco_pago}</Text>
          </View>
          <View style={{paddingHorizontal:30,alignItems:'center'}}  >
          <Text style={styles.totalText}>PRECO A PAGAR</Text>
          <Text style={styles.totalValue}>{this.state.preco}</Text>
          <View  style={{flexDirection:'row',padding:15}}>
          <Button title='Tudo Pago' onPress={this.apagarComanda} />
          {!this.state.showDez?(
          <Button title='10%' onPress={() =>this.setState(prevState=>({preco:prevState.preco*1.1,showDez:prevState.preco}))}/>
          ):(<Button title='X' color={'red'} onPress={()=>this.setState(prevState=>({preco:prevState.showDez,showDez:null}))}/>)}
          {!this.state.ShowBrinde ?(
          <Button title='Adicionar Brinde' onPress={()=>this.setState({ShowBrinde:true})}/>
          ):(
            <View>
              <TextInput
              placeholder='brinde'
              onChangeText={this.changeBrinde}
              value={this.state.Brinde}
              />
              {this.state.brindeFiltrado &&(
                this.state.brindeFiltrado.map((item,index)=>(
                  <TouchableOpacity key={index} style={[styles.container,{alignItems:'center',padding:8}]} onPress={() => this.selecionar(item)}>
                    <Text style={{fontSize:20}}>{item}</Text>
          
                  </TouchableOpacity>
                ))
              )}
              <Button title='OK' onPress={()=>this.setState(prevState=>({ShowBrinde:false}))}/>
            </View>
          )}
          </View>
          </View>
          <View style={{paddingHorizontal:30,alignItems:'center'}}>
          <Text style={styles.totalText}>PREÇO TOTAL</Text>
          <Text style={styles.totalValue}>{this.state.preco_total}</Text>
          </View>
          </View>
          <View  style={{flexDirection:'row',padding:15}}>
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
        ):(this.state.ordem===1 && this.state.data?(
          <Button title='desfazer pagamento' onPress={this.desfazerPagamento}/>
        ):(
          <View></View>
        ))}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  tableHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd', marginBottom: 10, backgroundColor: '#f7f7f7' },
  headerText: { flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'left' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  itemText: { flex: 1, fontSize: 16, textAlign: 'left' },
  summary: { marginTop: 20, alignItems: 'center' },
  totalText: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 24, marginVertical: 10 },
  input: { height: 40, borderColor: '#ddd', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10, borderRadius: 5, width: '80%' }
});

export default ComandaScreen;