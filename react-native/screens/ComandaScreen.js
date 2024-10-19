import React from 'react';
import { FlatList, View, Text, StyleSheet, Button, TextInput } from 'react-native';
import io from 'socket.io-client';

class ComandaScreen extends React.Component {
  constructor(props) {
    super(props);
    const { data, fcomanda, preco } = this.props.route.params;
    this.state = {
      data,
      fcomanda,
      preco,
      valor_pago: '', // Valor inicial vazio para garantir um controle adequado
      guardarValores:[],
      showBotoes:false,
      showDez:null,
    };
  }

  componentDidMount() {
    this.socket = io('http://192.168.1.36:5000');

    // Adicionar novo pedido ou atualizar a quantidade e preço do existente

    this.socket.on('preco', ( data ) => {
      if (data.comanda === this.state.fcomanda){
      this.setState({ data: data.dados, preco:data.preco });
      }
    });
    
  

    this.socket.on('comanda_deleted', ({ fcomanda }) => {
      if (fcomanda === this.state.fcomanda) {
        this.setState({ data: [], preco: 0 });
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
    const { fcomanda } = this.state;
    this.socket.emit('delete_comanda', { fcomanda: fcomanda });
  }

  changeValor = (valor_pago) => {
    this.setState({ valor_pago });
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

  render() {

    return (
      <View style={styles.container}>
        <Text>{this.state.fcomanda}</Text>
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

        <View style={styles.summary}>
          <Text style={styles.totalText}>PREÇO TOTAL</Text>
          <Text style={styles.totalValue}>{this.state.preco}</Text>
          <View  style={{flexDirection:'row',padding:15}}>
          <Button title='Tudo Pago' onPress={this.apagarComanda} />
          {!this.state.showDez?(
          <Button title='10%' onPress={() =>this.setState(prevState=>({preco:prevState.preco*1.1,showDez:prevState.preco}))}/>
          ):(<Button title='X' color={'red'} onPress={()=>this.setState(prevState=>({preco:prevState.showDez,showDez:null}))}/>)}
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