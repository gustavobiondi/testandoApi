import React from 'react';
import { FlatList,ScrollView,Modal, View, Text, StyleSheet, Button, TextInput, TouchableOpacity, KeyboardAvoidingView, Pressable} from 'react-native';
import io from 'socket.io-client';
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
      valor_pago: '',
      valor_pago_antigo:'', // Valor inicial vazio para garantir um controle adequado
      guardarValores:[],
      showBotoes:false,
      showDez:null,
      Brinde:'',
      showBrinde:true,
      nomes,
      showAlterarValor:false,
      alterarValorCategoria:'',
      alterarValor:'',
      brindeFiltrado:[],
      itensAlterados:[],
      show_mais:false,
      opcoes:['Editar','Caixinha','Desconto','Brinde'],
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
    
    const { fcomanda,preco,showDez } = this.state;
    
    if (showDez){
      console.log("caixinha", parseFloat(preco)-parseFloat(showDez))
      this.socket.emit('delete_comanda', { fcomanda: fcomanda, valor_pago:parseFloat(showDez),caixinha:parseFloat(preco)-parseFloat(showDez) });
      
    }
    else{
    this.socket.emit('delete_comanda', { fcomanda: fcomanda, valor_pago:preco,caixinha:null }); 
    }
    this.setState({showDez:false,nomes:[]})
    
  }

  changeValor = (valor_pago) => {
    if(this.state.showDez){
      this.setState({preco:this.state.showDez,showDez:null})
    }
    this.setState({valor_pago})
  }
  pagarParcial = () => {
    const { valor_pago, fcomanda, preco,showDez,valor_pago_antigo } = this.state;

    if(valor_pago){
      let valorNum = parseFloat(valor_pago);
    if(showDez){
      valorNum = parseFloat(valor_pago_antigo);
    }
    console.log('entrou pagar parcial')
    if (!isNaN(valorNum) && valorNum > 0 && valorNum <= preco) {
      console.log('entrou no if')
      this.socket.emit('faturamento')
      this.socket.emit('pagar_parcial', { valor_pago: valorNum, fcomanda: fcomanda,caixinha:parseFloat(valor_pago)-parseFloat(valor_pago_antigo) });
      this.setState((prevState) => ({
        preco: prevState.preco - valorNum,
        valor_pago: '',
        showDez:null,
      }));
    } else {
      alert('Insira um valor válido para pagamento parcial.');
    }
  }
  else alert('Insira um valor válido para pagamento parcial.');
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
        this.setState({ordem:0})
  }

  dataComnpleto = () =>{
    this.setState({data:this.state.dataGeral})
  }

  filtrarPorNome(nome){
    this.setState({
      data: this.state.dataGeral.filter(item=>item.nome===nome)
    })
  }
  dezporcento = () =>{
    if (this.state.valor_pago){
      this.setState(prevState => ({valor_pago:String(Math.floor(parseFloat(prevState.valor_pago)*1.1)),valor_pago_antigo:prevState.valor_pago}))
    }
    this.setState(prevState => ({ preco: Math.floor(prevState.preco * 1.1), showDez: prevState.preco }))
  }
  confirmarValor = () =>{
    const {alterarValor,alterarValorCategoria,fcomanda} = this.state
    this.socket.emit('alterarValor',{valor:alterarValor,categoria:alterarValorCategoria,comanda:fcomanda})
    this.setState({showAlterarValor:false,alterarValor:'',alterarValorCategoria:''})

  }
  
  
  selecionarOpcao = (item) =>{ 
    this.setState({show_mais:false})
    if (item==="Editar")
      this.aparecerBotoes()
       
    else if(item==="Desconto" || item==="Caixinha") 
      this.setState({alterarValorCategoria:item,showAlterarValor:true})
      
    else{
      this.setState({ showBrinde: false })
    }

  }
  mostrarOpcoes = () =>{
    this.setState({show_mais:true,showBrinde:true,showAlterarValor:false})
  }
    renderOpcoesModal() {
      const { show_mais, opcoes } = this.state;
      if (!show_mais) return null;
      return (
        <Modal 
          transparent={true}
          visible={show_mais}
          animationType="fade"
          onRequestClose={() => this.setState({ show_mais: false })}
        >

            <View style={styles.modalBox}>
              <View style={styles.modalModalbox}>
                <Pressable
                  style={{ paddingLeft: 105 }}
                  onPress={() => this.setState({ show_mais: false })}
                >
                  <Text>X</Text>
                </Pressable>
                {opcoes.map((item, index) => (
                  <View key={index} style={{ flexDirection: 'row' }}>
                    <Pressable
                      onPress={() => this.selecionarOpcao(item)}
                      style={styles.modalItem}
                    >
                      <Text style={{ fontSize: 18 }}>{item}</Text>
                    </Pressable>
                    {index === 0 && (
                      <View style={{ paddingLeft: 10, justifyContent: 'flex-end' }}>
                        {/* Espaço para conteúdo extra se necessário */}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
        </Modal>
      );
    }
  
    // 2. Função para renderizar a linha de nomes (filtros)
    renderNomesRow() {
      const { nomes, ordem } = this.state;
      if (nomes.length === 0 || ordem !== 0) return null;
      return (
        <View style={styles.nomeRow}>
          <Button title="Geral" onPress={this.dataComnpleto} />
          {nomes.map((item, index) => (
            <View key={index} style={styles.nomeButtonWrapper}>
              <Button title={item.nome} onPress={() => this.filtrarPorNome(item.nome)} />
            </View>
          ))}
          <Button title="Sem Nome" color={'orange'} onPress={() => this.filtrarPorNome('-1')} />
        </View>
      );
    }
  
    // 3. Função para renderizar a tabela de pedidos
    renderTabelaPedidos() {
      const { data, showBotoes } = this.state;
      return (
        <View>
          {data.length > 0 &&
            data.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.itemText}>
                  {item.pedido} {item.extra}
                </Text>
                <Text style={styles.itemText}>{item.quantidade}</Text>
                <Text style={styles.itemText}>{item.preco}</Text>
                {showBotoes && (
                  <View style={styles.buttonRow}>
                    <Button title="-" color={'red'} onPress={() => this.apagarPedidos(index)} />
                    <Button title="+" onPress={() => this.adicionarPedidos(index)} />
                  </View>
                )}
              </View>
            ))}
        </View>
      );
    }
  
    // 4. Função para renderizar a área de resumo e pagamento
    renderResumoPagamento() {
      const {
        ordem,
        showBrinde, // agora com letra minúscula para consistência
        Brinde,
        brindeFiltrado,
        preco_pago,
        preco,
        preco_total,
        valor_pago,
        showDez,
        alterarValorCategoria,
        alterarValor,
        showAlterarValor,
      } = this.state;
      if (ordem !== 0) {
        // Se ordem for diferente de 0, exibe a opção de desfazer pagamento ou uma mensagem
        return (
          <View>
            {ordem === 1 && this.state.data ? (
              <Button title="Desfazer Pagamento" onPress={this.desfazerPagamento} />
            ) : (
              <Text>não é possivel desfazer o pagamento</Text>
            )}
          </View>
        );
      }
      return (
        <View>
          {showAlterarValor &&(
            <View style={styles.buttonBrindeRow}>
            <TextInput
            keyboardType='numeric'
            placeholder="Valor"
            onChangeText={(alterarValor)=>this.setState({alterarValor})}
            value={alterarValor}
            style={styles.input}
          />
          <Button title="OK" onPress={this.confirmarValor} />
          </View>
        )}
          {!showBrinde && (
            <View>
              <View style={styles.buttonBrindeRow}>
                <TextInput
                  placeholder="Brinde"
                  onChangeText={this.changeBrinde}
                  value={Brinde}
                  style={styles.input}
                />
                <Button title="OK" onPress={this.confirmarBrinde} />
              </View>
              {brindeFiltrado &&
                brindeFiltrado.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.brindeContainer}
                    onPress={() => this.selecionar(item)}
                  >
                    <Text style={styles.brindeText}>{item}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          )}
          <View style={styles.summaryBox}>
            <View style={styles.paymentRow}>
              <View style={styles.paymentBlock}>
                <Text style={styles.totalText}>Valor Pago</Text>
                <Text style={styles.totalValue}>{preco_pago}</Text>
              </View>
              <View style={styles.paymentBlock}>
                <Text style={styles.totalText}>Valor a Pagar</Text>
                <Text style={styles.totalValue}>{preco}</Text>
              </View>
              <View style={styles.paymentBlock}>
                <Text style={styles.totalText}>Valor Total</Text>
                <Text style={styles.totalValue}>{preco_total}</Text>
              </View>
            </View>
  
            <View style={styles.actionsBox}>
              <View style={styles.parcialRow}>
                <TextInput
                  placeholder="Quanto?"
                  onChangeText={this.changeValor}
                  value={valor_pago}
                  keyboardType="numeric"
                  style={styles.input}
                />
                <Button title="Pagar Parcial" onPress={this.pagarParcial} />
              </View>
            </View>
            <View style={styles.buttonRow}>
              <Button
                style={styles.tudopagostyle}
                title="Tudo Pago"
                onPress={this.apagarComanda}
              />
              {!showDez ? (
                <Button style={styles.buttom10} title="10%" onPress={this.dezporcento} />
              ) : (
                <Button
                  title="X"
                  color={'red'}
                  onPress={() =>
                    this.setState((prevState) => ({
                      preco: prevState.showDez,
                      showDez: null,
                    }))
                  }
                />
              )}
            </View>
          </View>
        </View>
      );
    }
  
    // 5. Método render principal
    render() {
      const { fcomanda, ordem, showBotoes, show_mais } = this.state;
      return (
        <ScrollView style={styles.container}>
          <View style={styles.headerRow}>
            <Text>Comanda {fcomanda}</Text>
            <Button title="<" onPress={() => this.atualizarOrdem('+', ordem)} />
            <Text>{ordem}</Text>
            <Button title=">" onPress={() => this.atualizarOrdem('-', ordem)} />
  
            {/* Renderiza botões ou modal de opções conforme o estado */}
            {!showBotoes && (
              <View>
                {this.renderOpcoesModal()}
                {!show_mais && (
                  // Se show_mais for false, mostra o botão de "+" para abrir as opções
                  <Button title="+" onPress={this.mostrarOpcoes} />
                )}
              </View>
            )}
  
            {/* Caso showBotoes esteja true, exibe botões de Confirmar e Cancelar */}
            {showBotoes && (
              <View style={styles.tableRow}>
                <Button title="Cancelar" color={'red'} onPress={this.cancelar} />
                <Button title="Confirmar" onPress={this.confirmar} />
              </View>
            )}
          </View>
  
          {this.renderNomesRow()}
  
          <View style={styles.tableHeader}>
            <Text style={styles.headerText}>Pedido</Text>
            <Text style={styles.headerText}>Quant</Text>
            <Text style={styles.headerText}>Valor</Text>
          </View>
  
          {this.renderTabelaPedidos()}
  
          {this.renderResumoPagamento()}
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
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalModalbox: {
      width: 130,
      borderWidth: 2,
      borderTopLeftRadius: 3,
      paddingEnd: 10,
      alignItems: 'center',
      backgroundColor: 'white',
    },
    modalBox: {
      justifyContent:'flex-end',
      alignItems:'flex-end',
      padding: 17,
      paddingTop:210,
    },
    modalItem: {
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
    },
    nomeRow: {
      flexDirection: 'row',
      marginVertical: 10,
    },
    nomeButtonWrapper: {
      marginHorizontal: 5,
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
    modalOpcoes: {
      paddingLeft: 100,
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
    actionsBox: {},
    parcialRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 15,
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
      marginBottom: 30,
      marginTop: 25,
    },
    buttonBrindeRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginBottom: 30,
      marginTop: 15,
    },
    tudopagostyle: {
      width: 80,
      height: 35,
    },
    buttom10: {},
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