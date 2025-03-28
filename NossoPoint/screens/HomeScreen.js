import React from 'react';
import { StyleSheet, View, Button, TextInput, FlatList, TouchableOpacity, Text,ScrollView } from 'react-native';
import io from 'socket.io-client';
import { UserContext } from '../UserContext'; // Import the context

export default class HomeScreen extends React.Component {
  static contextType = UserContext;

  constructor(props) {
    super(props);
    this.state = {
      username:'',
      cargo:'',
      comand: '',
      pedido: '',
      extra: '',
      nome:'',
      preco: null,
      preco_total:0,
      preco_pago:0,
      data: [],
      categoria: 'produto',
      pedido_filtrado: [],
      comanda_filtrada:[],
      comanda_filtrada_abrir:[],
      quantidadeSelecionada: [],
      pedidosSelecionados: [],
      extraSelecionados: [],
      nomeSelecionado:[],
      options:[],
      selecionados:[],
      opcoesSelecionadas:[],
      showPedido: false,
      showComandaPedido: false,
      showComanda:false,
      showQuantidade: true,
      showPedidoSelecionado: false,
      quantidade: 1,
      quantidadeRestanteMensagem: null,
      pedidoRestanteMensagem: null,
    };
  }

  componentDidMount() {
      const { user } = this.context;
        this.setState({ username: user.username });
        console.log(user.username);
       
    

    this.socket = io('https://flask-backend-server-yxom.onrender.com'); // Se o backend estiver na porta 5000
    this.socket.on('dados_atualizados', ({ dados }) => this.setState({ data: dados }));
    this.socket.on('preco', (data) => this.setState({ preco: data.preco_a_pagar,preco_pago:data.preco_pago,preco_total:data.preco_total}));
    this.socket.on('error', ({ message }) => console.error('Erro do servidor:', message));
    this.socket.on('pedidos', (res)=>{
      
      this.setState({ pedido_filtrado: res })
      console.log(res)
    })
    this.socket.on('comandas',(res)=> this.setState({ comanda_filtrada: res }))
    this.socket.on('comandas_abrir',(res)=> this.setState({ comanda_filtrada_abrir: res }))
    this.socket.on('ativar_opcoes',({options})=>{
    console.log(options)
    this.setState({options})
  })
    
    this.socket.on('alerta_restantes', (data) => {
      this.setState({ quantidadeRestanteMensagem: data.quantidade, pedidoRestanteMensagem: data.item });
    });
    this.socket.on('quantidade_insuficiente', (data) => {
        if (data.erro) {
          this.setState({
            comand: '',
            pedido: '',
            extra: '',
            quantidade: 1,
            showQuantidade: false,
            showPedidoSelecionado: false,

          }); 
          alert('Quantidade Insuficiente')
        } else {
          const { comand, pedido, quantidade, extra } = this.state;
          const currentTime = this.getCurrentTime();
          this.socket.emit('insert_order', { 
            comanda: comand, 
            pedidosSelecionados: [pedido], 
            quantidadeSelecionada: [quantidade],
            extraSelecionados: [extra],
            horario: currentTime
          });
          this.setState({ comand: '', pedido: '', quantidade: 1, extra: '' });
        }
      })
  }

  componentWillUnmount() {
    this.socket.off('dados_atualizados');
    this.socket.off('preco');
    this.socket.off('error');
    this.socket.off('pedidos');
    
    this.socket.off('quantidade_insuficiente');
    this.socket.off('alerta_restantes');
  }
  
  changeComanda = (comand) => {
    this.setState({ comand , showComandaPedido: !!comand})
    if (comand){
      this.socket.emit('pesquisa_comanda',{comanda:comand})
    }
  };


  changePedido = (pedido) => {
    this.setState({ pedido, showPedido: !!pedido,selecionaveis:[],selecionados:[],options:[]});
    if (pedido) {
      this.socket.emit('pesquisa', pedido);
    }
  };
  changeCategoria = (categoria) => this.setState({ categoria });
  getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  sendData = () => {
    const { comand, nome,nomeSelecionado, pedidosSelecionados, quantidadeSelecionada, extraSelecionados, pedido, quantidade, extra,opcoesSelecionadas, username,options,selecionados} = this.state;
    const currentTime = this.getCurrentTime();
    console.log(nomeSelecionado)
    if (comand && pedidosSelecionados.length && quantidadeSelecionada.length) {
      this.socket.emit('insert_order', { 
        comanda: comand.toLowerCase(), 
        pedidosSelecionados, 
        quantidadeSelecionada,
        extraSelecionados,
        nomeSelecionado,
        horario: currentTime,
        username:username,
        opcoesSelecionadas:opcoesSelecionadas,
      });
      this.setState({ comand: '', pedido: '',pedidosSelecionados: [],showComandaPedido:false, quantidadeSelecionada: [], extraSelecionados: [],comanda_filtrada:[],comanda_filtrada_abrir:[], quantidade: 1, showQuantidade: false, showPedidoSelecionado: false,nome:'',nomeSelecionado:[],showComanda:false,opcoesSelecionadas:[],selecionados:[]});
    } else if (comand && pedido && quantidade) {
      console.log('fetch')
      fetch('https://flask-backend-server-yxom.onrender.com/verificar_quantidade', {  // Endpoint correto
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            item: pedido,
            quantidade: quantidade
        })
    })
    .then(response => response.json())
    .then(data => {
      console.log(data)
      if (data.erro) {
        this.setState({
          comand: '',
          pedido: '',
          extra: '',
          nome:'',
          quantidade: 1,
          showQuantidade: false,
          showPedidoSelecionado: false,
          comanda_filtrada:[],
          comanda_filtrada_abrir:[],
          showComandaPedido:false,
        })
        const quantidade = data.quantidade
        const quantidadeRestante = 'quantidade estoque insuficiente. Restam apenas '+String(quantidade)
        alert(quantidadeRestante)
        ;
      } else {
        const { comand, pedido,nomeSelecionado, quantidade, extra,username,nome,selecionados} = this.state;
        
        const quantidadeR = data.quantidade
        const novaQ = parseFloat(quantidadeR)-quantidade
        if (novaQ){
          const alerta = 'ATENCAO RESTAM APENAS '+String(novaQ)+'\nRECOMENDADO REPOR ESTOQUE!'
          alert(alerta)
        }

        const currentTime = this.getCurrentTime();
        this.socket.emit('insert_order', { 
          comanda: comand.toLowerCase(), 
          pedidosSelecionados: [pedido], 
          quantidadeSelecionada: [quantidade],
          extraSelecionados: [extra],
          nomeSelecionado:[nome],
          horario: currentTime,
          comanda_filtrada:[],
          comanda_filtrada_abrir:[],
          username:username,
          opcoesSelecionadas:selecionados,
        });

        this.setState({ comand: '', pedido: '', quantidade: 1, extra: '',nome:'',showComandaPedido:false,selecionados:[],options:[]});
      }
    })
    .catch(error => console.error('Erro ao adicionar pedido:', error));
    }
    else {
      console.warn('Por favor, preencha todos os campos.');
    }
  };


  pagarParcial = () => {
    const { valor_pago, fcomanda, preco } = this.state;
    const valorNum = parseFloat(valor_pago);
    if (!isNaN(valorNum) && valorNum > 0 && valorNum <= preco) {
      this.socket.emit('pagar_parcial', { valor_pago: valorNum, fcomanda });
      this.setState((prevState) => ({ preco: prevState.preco - valorNum, valor_pago: '' }));
    } else {
      console.warn('Insira um valor válido para pagamento parcial.');
    }
  };

  selecionarPedido = (pedido) => {
    this.setState({ pedido, pedido_filtrado: [], showQuantidade: true });
    this.socket.emit('opcoes',{pedido})
  };
  selecionarComandaPedido =(comand) =>{
    this.setState({ comand, comanda_filtrada: [], showComandaPedido:false})
  }
  
  selecionarComanda =(fcomanda) =>{
    this.setState({ fcomanda, comanda_filtrada_abrir: [], showComanda:false})
  }

  aumentar_quantidade = () => this.setState((prevState) => ({ quantidade: prevState.quantidade + 1 }));
  diminuir_quantidade = () => this.setState((prevState) => ({ quantidade: Math.max(prevState.quantidade - 1, 1) }));
  mudar_quantidade = (quantidade) => this.setState({ quantidade: parseInt(quantidade) || 1 });
  
  adicionarPedido = () => {
    const {pedido, quantidade} = this.state;
    fetch('https://flask-backend-server-yxom.onrender.com/verificar_quantidade', {  // Endpoint correto
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            item: pedido,
            quantidade: quantidade
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.erro) {
            this.setState({
                quantidade: 1,
                showQuantidade: false,
                pedido: '',
                extra: '',
                nome:'',
                showPedido: false,
                options:[],
            

            });
            const quantidade = data.quantidade
            const quantidadeRestante = 'quantidade estoque insuficiente. Restam apenas '+String(quantidade)
            alert(quantidadeRestante)

        } else {
            const { pedido, quantidade, extra, nome, selecionados} = this.state;
            const quantidadeR = data.quantidade
            const novaQ = parseFloat(quantidadeR)-quantidade
            if (novaQ){
              const alerta = 'ATENCAO RESTAM APENAS '+String(novaQ)+'\nRECOMENDADO REPOR ESTOQUE!'
              alert(alerta)
            }

            this.setState((prevState) => ({
                pedidosSelecionados: [...prevState.pedidosSelecionados, pedido],
                quantidadeSelecionada: [...prevState.quantidadeSelecionada, quantidade],
                extraSelecionados: extra ? [...prevState.extraSelecionados, extra] : [...prevState.extraSelecionados, ''],
                nomeSelecionado: nome? [...prevState.nomeSelecionado, nome] : [...prevState.nomeSelecionado, ''],
                quantidade: 1,
                showQuantidade: false,
                pedido: '',
                extra: '',
                nome:'',
                showPedidoSelecionado: true,
                showPedido: false,
                options:[],
                opcoesSelecionadas: selecionados? [...prevState.opcoesSelecionadas, selecionados] : [...prevState.opcoesSelecionadas, []]
            }));
        }
    })
    .catch(error => console.error('Erro ao adicionar pedido:', error));
};


  adicionarPedidoSelecionado = (index) => this.setState((prevState) => ({ quantidadeSelecionada: prevState.quantidadeSelecionada.map((q, i) => (i === index ? q + 1 : q)) }));
  removerPedidoSelecionado = (index)=> {
    this.setState((prevState)=>({
    quantidadeSelecionada:prevState.quantidadeSelecionada.map((q,i)=>(i===index ? q-1:q)),
    }))
    if(this.state.quantidadeSelecionada[index]-1===0){
      console.log(this.state.quantidadeSelecionada[index])
    const quantidadeFiltrada = this.state.quantidadeSelecionada.filter((item,i)=>i!==index)
    const pedidoFilrado = this.state.pedidosSelecionados.filter((item,i)=>index!==i)
    if(!this.pedidosSelecionados){this.setState({showPedidoSelecionado:false})}
    this.setState({quantidadeSelecionada:quantidadeFiltrada,pedidosSelecionados:pedidoFilrado})
    }
    ;}
  changeExtra = (extra) => this.setState({ extra });
  render() {
    return (
      <View style={styles.mainContainer} >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <View style={[styles.container,styles.row]}>
              
              <TextInput
                placeholder="Comanda"
                onChangeText={this.changeComanda}
                value={this.state.comand}
                style={[styles.input, styles.inputComanda]} 
              />
  
              <TextInput
                placeholder="Digite o pedido"
                onChangeText={this.changePedido}
                value={this.state.pedido}
                style={[styles.input, styles.inputPedido]}
              />

                {this.state.showQuantidade && (
                <View style={styles.row}>
                <Button title="-" onPress={this.diminuir_quantidade} />
                <TextInput style={[styles.input,styles.inputQuantidade]}  value={String(this.state.quantidade)} onChangeText={this.mudar_quantidade} />
                <Button title="+" style={[styles.botoes,{marginRight:0}]} onPress={this.aumentar_quantidade} />
                </View>
              )}
              </View>   
              
              {this.state.options && (
                this.state.options.map((opcao, index) => {
                  const categoria = Object.keys(opcao)[0];
                  const itens = opcao[categoria];

                  return (
                    <View key={index}>
                      <Text>{categoria}</Text> 

                      {itens.map((item, itemIndex) => {
                        // Verifica se o item foi selecionado
                        const itemSelecionado = this.state.selecionados.includes(item);

                        return (
                          <TouchableOpacity
                            key={itemIndex}
                            style={{
                              flexDirection: 'row', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              paddingVertical: 10, // Espaçamento vertical
                              paddingHorizontal: 10, // Espaçamento horizontal para toda a linha
                            }}
                            onPress={() => {
                              // Atualiza a lista de selecionados de maneira imutável
                              this.setState((prevState) => {
                                let selecionados = [...prevState.selecionados];

                                if (itemSelecionado) {
                                  // Se o item já está selecionado, removemos da lista
                                  selecionados = selecionados.filter(
                                    (selected) => selected !== item
                                  );
                                } else {
                                  // Caso contrário, adicionamos o item à lista de selecionados
                                  
                                  selecionados.push(item);
                                }

                                // Atualiza o estado com a nova lista de itens selecionados
                                return { selecionados };
                              });
                            }}
                          >
                           
                            <Text style={{ flex: 1 }}>{item}</Text>

                            
                            <View
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10, // Fazendo o círculo
                                backgroundColor: itemSelecionado ? 'green' : 'lightgray', // Cor da bola
                              }}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })
              )}



              <TextInput
              placeholder="Extra (opcional)"
              onChangeText={this.changeExtra}
              value={this.state.extra}
              style={[styles.input, styles.inputPedido]}
              />
           
          
            {this.state.showComandaPedido && (
                this.state.comanda_filtrada.map((item,index)=>(
                    <TouchableOpacity key={index} style={[styles.container,{alignItems:'left',padding:8}]} onPress={() => this.selecionarComandaPedido(item)}>
                      <Text style={{fontSize:20}}>{item}</Text>
            
                    </TouchableOpacity>
                  ))
            )}
        
            {this.state.showPedido && (
                this.state.pedido_filtrado.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.container, {alignItems: 'center', padding: 8}]} 
                    onPress={() => this.selecionarPedido(item)}
                  >
                    <Text style={{fontSize: 20}}>{item}</Text> 
                  </TouchableOpacity>
                ))
              )}

            
                <TextInput
                placeholder="Nome (opicional)"
                onChangeText={(nome)=>this.setState({nome})}
                value={this.state.nome}
                style={[styles.input, styles.inputPedido]}
                />
              
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center'}}>
            <Button  title="Adicionar" onPress={this.adicionarPedido} />
            {((!this.state.showPedido && this.state.showPedidoSelecionado)||(!this.state.showPedidoSelecionado && this.state.showPedido)) &&(
            <Button title="Enviar pedido" onPress={this.sendData} />
            )}
            </View>
  
            {this.state.showPedidoSelecionado && this.state.pedidosSelecionados.map((item,index)=>(
              <View key={index} style={[styles.container,{flexDirection:'row'}]}>
              <Text>{item}</Text>
              <View style={[styles.container,{flexDirection:'row'}]}>
                <Button title="-" color="red" onPress={() => this.removerPedidoSelecionado(index)} />
                <Text>{this.state.quantidadeSelecionada[index]}</Text>
                <Button title="+" onPress={() => this.adicionarPedidoSelecionado(index)} />
              </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    ); } }

    export const getCurrentTime = () => new Date().toTimeString().slice(0, 5);


const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  formContainer: {
    marginBottom: 20,
  },
  row:{
    flexDirection:'row'
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  inputComanda: {
    flex: 1,
    marginBottom: 15,
  },
  inputPedido: {
    flex: 2,
    marginBottom: 15,
  },
  inputExtra: {
    flex: 1,
    marginBottom: 15,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  quantityText: {
    marginHorizontal: 10,
    fontSize: 18,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stockText: {
    marginBottom: 15,
    color: 'red',
  },
  warningText: {
    color: 'orange',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  listaPedidos: {
    marginTop: 15,
    marginBottom: 20,
  },
  pedidoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 5,
  },
  pedidoText: {
    flex: 1,
    fontSize: 16,
  },
  pedidoItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
  },
});