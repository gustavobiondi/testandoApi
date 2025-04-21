import React from 'react';
import { StyleSheet, View, Button, TextInput, FlatList, TouchableOpacity, Text,ScrollView,Pressable } from 'react-native';
import io from 'socket.io-client';
import { UserContext } from '../UserContext'; // Import the context
import { API_URL } from "./url";
import { Keyboard } from 'react-native';

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
      data: [],
      dataFixo:[],
      pedido_filtrado: [],
      comanda_filtrada:[],
      comandaGeral:[],
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
      showQuantidade: false,
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
       
    

    this.socket = io(`${API_URL}`); // Se o backend estiver na
    
    this.socket.emit('getCardapio',false);
    this.socket.on('respostaCardapio',(data)=>{ 
      console.log('entrei get cardapio',data);
      this.setState({pedido_filtrado:data.dataCardapio,dataFixo:data.dataCardapio})
    })
    this.socket.emit('getComandas',false)
    this.socket.on('respostaComandas',(data)=>{
      if (data.dados_comandaAberta){
        this.setState({comanda_filtrada:data.dados_comandaAberta,comandaGeral:data.dados_comandaAberta})
      }
    })
    
    
    
    this.socket.on('error', ({ message }) => console.error('Erro do servidor:', message));
      
    
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
    this.socket.off('getCardapio')
    this.socket.off('error');
    this.socket.off('pedidos');
    
    this.socket.off('quantidade_insuficiente');
    this.socket.off('alerta_restantes');
  }
  
  changeComanda = (comand) => {
    const comandaLower = String(comand).toLowerCase();
    const comanda_filtrada = this.state.comandaGeral.filter(item=>item.comanda.startsWith(comandaLower))
    this.setState({
      comanda_filtrada:comanda_filtrada,
      comand: comandaLower, 
      showComandaPedido: !!comand 
    });
  };
  


  changePedido = (pedid) => {
    const pedido = String(pedid).toLowerCase()
    this.setState({pedido,showPedido: !!pedido,selecionaveis:[],selecionados:[],options:[]});
    if (pedido.startsWith('.') && pedido.length>1){
      const pedidoSemPonto = pedido.slice(1)
      const dataPesquisado = this.state.dataFixo.filter(item=>String(item.id)===pedidoSemPonto)
      if (dataPesquisado){
        this.setState({pedido_filtrado:dataPesquisado})
      }
    }
    else if (pedido && this.state.dataFixo){
      const dataPesquisado = this.state.dataFixo.filter(item=>item.item.toLowerCase().startsWith(pedido))
      if (dataPesquisado){
      this.setState({pedido_filtrado:dataPesquisado})
      }
    }
    else if (!pedido){
      this.setState({pedido_filtrado:this.state.dataFixo})
    }
    
  };
  
  getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  sendData = () => {
    const pedido = this.state.pedido.trim()
    const comand = this.state.comand.trim()
    const { nome,nomeSelecionado, pedidosSelecionados, quantidadeSelecionada, extraSelecionados, quantidade, extra,opcoesSelecionadas, username,options,selecionados} = this.state;
    const currentTime = this.getCurrentTime();
    console.log(nomeSelecionado)
    if(!comand){
      alert("Digite a comanda");
    }
    else if (!pedido && !pedidosSelecionados){
      alert('Digite o pedido')
    }
    if (comand && pedidosSelecionados.length && quantidadeSelecionada.length) {
      
  
      // Encontra os índices com quantidade 0
      const indicesValidos = [];
      quantidadeSelecionada.forEach((q, i) => {
        if (q > 0) indicesValidos.push(i);
      });
      const NovosPedidos=[]
      pedidosSelecionados.map((p,i)=>{
        for (let j=0;j<indicesValidos.length;j++){
          if (indicesValidos[j]===i){
            NovosPedidos.push(p)
          }
        }
      })
      const NovasQuantidades=[]
      quantidadeSelecionada.map((p,i)=>{
        for (let j=0;j<indicesValidos.length;j++){
          if (indicesValidos[j]===i){
            NovasQuantidades.push(p)
          }
        }
      })
      const NovosExtras=[]
      extraSelecionados.map((p,i)=>{
        for (let j=0;j<indicesValidos.length;j++){
          if (indicesValidos[j]===i){
            NovosExtras.push(p)
          }
        }
      })
      const NovosNomes=[]
      nomeSelecionado.map((p,i)=>{
        for (let j=0;j<indicesValidos.length;j++){
          if (indicesValidos[j]===i){
            NovosNomes.push(p)
          }
        }
      })
      
      this.socket.emit('insert_order', { 
        comanda: comand, 
        pedidosSelecionados:NovosPedidos, 
        quantidadeSelecionada:NovasQuantidades,
        extraSelecionados:NovosExtras,
        nomeSelecionado:NovosNomes,
        horario: currentTime,
        username:username,
        opcoesSelecionadas:opcoesSelecionadas,
      });
      this.setState({ comand: '', pedido: '',pedidosSelecionados: [],showPedidoSelecionado:false,showPedido:false,showComandaPedido:false, quantidadeSelecionada: [], extraSelecionados: [],comanda_filtrada:[],comanda_filtrada_abrir:[], quantidade: 1, showQuantidade: false, showPedidoSelecionado: false,nome:'',nomeSelecionado:[],showComanda:false,opcoesSelecionadas:[],selecionados:[]});
    } else if (comand && pedido && quantidade) {
      console.log('fetch')
      fetch(`${API_URL}/verificar_quantidade`, {  
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
          showPedido:false,
          comanda_filtrada:[],
          comanda_filtrada_abrir:[],
          showComandaPedido:false,
        })
        const quantidade = data.quantidade
        const quantidadeRestante = 'quantidade estoque insuficiente. Restam apenas '+String(quantidade)
        alert(quantidadeRestante)
        ;
      } else {
        const {nomeSelecionado, quantidade, extra,username,nome,selecionados} = this.state;
        
        const quantidadeR = data.quantidade
        const novaQ = parseFloat(quantidadeR)-quantidade
        if (novaQ){
          const alerta = 'ATENCAO RESTAM APENAS '+String(novaQ)+'\nRECOMENDADO REPOR ESTOQUE!'
          alert(alerta)
        }

        const currentTime = this.getCurrentTime();
        this.socket.emit('insert_order', { 
          comanda: comand, 
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

        this.setState({ comand: '', pedido: '', quantidade: 1, extra: '',nome:'',showComandaPedido:false,showPedidoSelecionado:false,showPedido:false,selecionados:[],options:[],showQuantidade:false});
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
    console.log(pedido)
    this.setState({ pedido, pedido_filtrado: [], showQuantidade: true });
    
    fetch(`${API_URL}/opcoes`,{
      method: 'POST',
      headers:{
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pedido:pedido,
      })
      
    }).then(response=>response.json())
    .then(dados=>{
      console.log(dados)
      if(dados){
      this.setState({options:dados.options})
      }
    })
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
    const pedido = this.state.pedido.trim()

    const {showQuantidade, quantidade} = this.state;
    
    if(showQuantidade){
    fetch(`${API_URL}/verificar_quantidade`, {  // Endpoint correto
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
  }};


  adicionarPedidoSelecionado = (index) => this.setState((prevState) => ({ quantidadeSelecionada: prevState.quantidadeSelecionada.map((q, i) => (i === index ? q + 1 : q)) }));
  removerPedidoSelecionado = (index)=> {
    this.setState((prevState)=>({
    quantidadeSelecionada:prevState.quantidadeSelecionada.map((q,i)=>(i===index ? q-1<0? 0:q-1 :q)),
    }))
  }
    
    
  changeExtra = (extra) => this.setState({ extra });
  render() {
    return (
      <View style={styles.mainContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.innerContainer}>
            <View style={styles.inputRow}>
              <TextInput
                placeholder="Comanda"
                onChangeText={this.changeComanda}
                value={this.state.comand}
                style={styles.inputComanda}
              />
              <TextInput
                placeholder="Digite o pedido"
                onChangeText={this.changePedido}
                value={this.state.pedido}
                style={styles.inputPedido}
              />
            {this.state.showQuantidade && (
              <View style={styles.quantityRow}>
                <Button title="-" onPress={this.diminuir_quantidade} />
                <TextInput
                  style={styles.inputQuantidade}
                  value={String(this.state.quantidade)}
                  onChangeText={this.mudar_quantidade}
                />
                <Button title="+" onPress={this.aumentar_quantidade} />
              </View>
            )}
</View>
            {this.state.options && this.state.options.map((opcao, index) => {
              const categoria = Object.keys(opcao)[0];
              const itens = opcao[categoria];

              return (
                <View key={index} style={styles.categoriaContainer}>
                  <Text style={styles.categoriaTitle}>{categoria}</Text>

                  {itens.map((item, itemIndex) => {
                    const itemSelecionado = this.state.selecionados.includes(item);
                    return (
                      <TouchableOpacity
                        key={itemIndex}
                        style={styles.optionItem}
                        onPress={() => {
                          this.setState(prevState => {
                            let selecionados = [...prevState.selecionados];
                            if (itemSelecionado) {
                              selecionados = selecionados.filter(sel => sel !== item);
                            } else {
                              selecionados.push(item);
                            }
                            return { selecionados };
                          });
                        }}
                      >
                        <Text style={styles.optionText}>{item}</Text>
                        <View
                          style={[styles.optionCircle, { backgroundColor: itemSelecionado ? 'green' : 'lightgray' }]}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}

            {this.state.showComandaPedido && this.state.comanda_filtrada.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.comandaItem}
                onPress={() => this.selecionarComandaPedido(item.comanda)}
              >
                <Text style={styles.comandaText}>{item.comanda}</Text>
              </TouchableOpacity>
            ))}

            {this.state.showPedido && this.state.pedido_filtrado.map((item, index) => (

              index<5 &&(

              <Pressable
                key={index}
                style={styles.pedidoSelecionadoItem}
                onPress={() => {
                  Keyboard.dismiss();
                  this.selecionarPedido(item.item);
                }}
              >
                <Text style={styles.pedidoText}>{item.item}</Text>
              </Pressable>
              )
  ))}

            <TextInput
              placeholder="Extra (opcional)"
              onChangeText={this.changeExtra}
              value={this.state.extra}
              style={styles.inputExtra}
            />

            <TextInput
              placeholder="Nome (opicional)"
              onChangeText={(nome) => this.setState({ nome })}
              value={this.state.nome}
              style={styles.inputNome}
            />

            <View style={styles.actionRow}>
              <Button title="Adicionar" onPress={this.adicionarPedido} />
              {(this.state.showPedidoSelecionado !== this.state.showPedido) && (
                <Button title="Enviar pedido" onPress={this.sendData} />
              )}
            </View>
            {this.state.showPedidoSelecionado && this.state.pedidosSelecionados.map((item, index) => (
              <View key={index} style={styles.pedidoEditItem}>
                <Text>{item}</Text>
                <View style={styles.pedidoEditControls}>
                  <Button title="-" color="red" onPress={() => this.removerPedidoSelecionado(index)} />
                  <Text>{this.state.quantidadeSelecionada[index]}</Text>
                  <Button title="+" onPress={() => this.adicionarPedidoSelecionado(index)} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }
}

export const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  innerContainer: {
    flexGrow: 1,
  },
  inputRow: {flexDirection:"row",},
  inputComanda: {
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius:5,
    flexDirection:'row',
  },
  inputPedido: {
    flex: 2,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginHorizontal:5,
  },
  quantityRow: {flexDirection:"row",},
  inputQuantidade: {
    height: 40,
    width: 30,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    textAlign: 'center',
    marginHorizontal: 3,
  },
  categoriaContainer: {
    marginTop: 10,
  },
  categoriaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth:0.5,
    borderColor:"black",
    borderStyle:"solid",
    },
  optionText: {
    fontSize: 14,
  },
  optionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  inputExtra: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginTop: 15,
  },
  comandaItem: {
    padding: 8,
  },
  comandaText: {
    fontSize: 20,
  },
  pedidoSelecionadoItem: {
    padding: 8,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderColor: "black",
    borderStyle:"solid", 
    marginBottom:5,
  },
  pedidoText: {
    fontSize: 20,
  },
  inputNome: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  pedidoEditItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  pedidoEditControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
