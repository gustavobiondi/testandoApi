import React from 'react';
import { View, FlatList,TouchableOpacity,Modal,ScrollView,Text, StyleSheet, Button, TextInput, RefreshControl } from 'react-native';
import io from 'socket.io-client';
import { API_URL } from "./url";

export default class EstoqueScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      dataGeralAlterar:[],
      dataGeral: [],
      showEditar: false,
      itensAlterados: [],
      estoque: '',
      refreshing: false,  // Adicionando o estado de refresh
      showAdicionar: true,
      showInputsAdicionar:false,
      showInputEditar:false,
      showInputsRemover:false,
      showDataFiltrado:false,
      AdicionarNovoNome:"",
      AdicionarItem:"",
      AdicionarQuantidade:"",
      AdicionarEstoqueIdeal:"",
      titleEnv:"",
    };
    this.refreshData = this.refreshData.bind(this);
  }

  componentDidMount() {
    this.socket = io(`${API_URL}`);
    this.refreshData();  // Carregar os dados ao montar o componente
  }

  refreshData() {
    this.setState({ refreshing: true }); // Inicia o refresh
    
    
    this.socket.emit('getEstoque',false)
    this.socket.on('respostaEstoque', (data) => {
      console.log('Dados iniciais recebidos:', data);
      if (data.dataEstoque){
      this.setState({
        data: data.dataEstoque,
        dataGeral: data.dataEstoque,
        refreshing: false, // Finaliza o refresh
      });
    }
    });
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  aumentarQuantidade = (index) => {
    const atualizar = [...this.state.data];
    atualizar[index].quantidade = (parseInt(atualizar[index].quantidade) + 1).toString();
    this.setState({ data: atualizar });
    this.atualizarItensAlterados(atualizar[index]);
  };

  diminuirQuantidade = (index) => {
    const atualizar = [...this.state.data];
    atualizar[index].quantidade = Math.max(0, parseInt(atualizar[index].quantidade) - 1).toString();
    this.setState({ data: atualizar });
    this.atualizarItensAlterados(atualizar[index]);
  };

  alterarQuantidade = (quantidade, index) => {
    const quantidadeNumber = parseInt(quantidade, 10) || 0;
    const atualizar = [...this.state.data];
    atualizar[index].quantidade = quantidadeNumber.toString();
    this.setState({ data: atualizar });
    this.atualizarItensAlterados(atualizar[index]);
  };

  atualizarItensAlterados = (itemAtualizado) => {
    this.setState((prevState) => {
      const pedidoNaLista = prevState.itensAlterados.some(
        (item) => item.item === itemAtualizado.item
      );

      const itensAlteradosAtualizados = pedidoNaLista
        ? prevState.itensAlterados.map((item) =>
            item.item === itemAtualizado.item ? itemAtualizado : item
          )
        : [...prevState.itensAlterados, itemAtualizado];

      return { itensAlterados: itensAlteradosAtualizados };
    });
  };

  handleConfirmar = () => {
    const { itensAlterados } = this.state;
    this.socket.emit('atualizar_estoque', { itensAlterados });
    this.setState({ showEditar: false, itensAlterados: [] });
  };

  searchEstoque = (valor,data) => {
    if(valor){
    const normalizedEstoque = valor.toLowerCase();
    if (normalizedEstoque && this.state.dataGeral) {
      const dataFiltrado = this.state.dataGeral.filter((item) =>
        item.item.toLowerCase().startsWith(normalizedEstoque)
      );
      this.setState({ estoque:valor, [data]: dataFiltrado });
    } else {
      this.setState({ estoque:valor, [data]: this.state.dataGeral || [] });
    }
  }
  else{
    this.setState({estoque:valor,[data]:this.state.dataGeral})
  }
  }; 
  Enviar =()=>{
const {AdicionarItem, AdicionarEstoqueIdeal,AdicionarQuantidade,titleEnv,AdicionarNovoNome}=this.state;
if (AdicionarItem){
this.socket.emit('EditingEstoque', {tipo:titleEnv,item:AdicionarItem,novoNome:AdicionarNovoNome,quantidade:AdicionarQuantidade, estoqueIdeal:AdicionarEstoqueIdeal,estoque:'estoque'});
this.setState({AdicionarItem:'',AdicionarNovoNome:'',AdicionarEstoqueIdeal:'',AdicionarQuantidade:''});
}
else alert("Item nao identificado")
  }

  filtrar= (dados) =>{
  
    this.setState(prevState=>({showDataFiltrado:!prevState.showDataFiltrado}))
    if (dados ==='filtrar'){
        const dataFiltrado = this.state.data.filter(item=>item.quantidade<item.estoque_ideal*0.5)
        this.setState({data:dataFiltrado})
    }
    else{
      this.setState({data:this.state.dataGeral})
    }
  }

  render() {
    const {refreshing} = this.state
    const {
      showAdicionar,
      showInputsAdicionar,
      showInputEditar,
      showInputsRemover,
      titleEnv,
      estoque,
    } = this.state;
    let inputs=[];
    let titleEnviar='';
    if (showInputsAdicionar) {
      inputs = [
        { key: 'nome', label: 'Nome do Item',nome:"AdicionarItem",tipoTeclado:'default'},
        { key: 'quantidade', label: 'Quantidade',nome:"AdicionarQuantidade",tipoTeclado:'numeric' },
        { key: 'Estoque Ideal', label: 'Estoque Ideal',nome:"AdicionarEstoqueIdeal",tipoTeclado:'numeric'},
      ];
      titleEnviar = "Adicionar";
    } else if (showInputEditar) {
      inputs = [
        { key: 'nome', label: 'Nome do Item',nome:"AdicionarItem",tipoTeclado:'default'},
        { key: 'Novo nome', label: 'Novo Nome do Item',nome:"AdicionarNovoNome",tipoTeclado:'default'},
        { key: 'Estoque Ideal', label: 'Estoque Ideal',nome:"AdicionarEstoqueIdeal",tipoTeclado:'numeric'},
      ];
      titleEnviar = "Editar";
    } else if (showInputsRemover) {
      inputs = [
        { key: 'nome', label: 'Nome do Item',nome:"AdicionarItem",keyboardType:'default'},
      ];
      titleEnviar = "Remover";
    }
    return (
      <View style={styles.container}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>ITEM</Text>
           <TextInput
                      style={styles.inputEstoque}
                      onChangeText={(estoque)=>this.searchEstoque(estoque,'data')}
                      value={estoque}
                    />
          {!this.state.showEditar ? (
            <Button title="Editar" onPress={() => this.setState({ showEditar: true })} />
          ) : (
            <Button title="Confirmar" onPress={this.handleConfirmar} />
          )}
          <Button
                    title="🌪️"
                   onPress={() => this.filtrar(this.state.showDataFiltrado ? 'desfiltrar' : 'filtrar')}
                    />
        </View>

        <FlatList
          data={this.state.data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.tableRow}>
              <Text style={styles.itemText}>{item.item}:</Text>
              {this.state.showEditar ? (
                <View style={styles.editRow}>
                  <Button title="-" onPress={() => this.diminuirQuantidade(index)} />
                  <TextInput
                    style={styles.input}
                    value={item.quantidade.toString()}
                    onChangeText={(text) => this.alterarQuantidade(text, index)}
                    keyboardType="numeric"
                  />
                  <Button title="+" onPress={() => this.aumentarQuantidade(index)} />
                </View>
                ) : (this.state.showDataFiltrado ? (
                                <View style={{flexDirection:'row'}}>
                                <Text style={styles.estoque_ideal}>{item.estoque_ideal}</Text>
                                <Text style={[styles.quantidade,{color:'red'}]}>{item.quantidade}</Text>
                                </View>
              ) : (
                <Text style={styles.quantidade}>{item.quantidade}</Text>
    ))}
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={this.refreshData}  // Chama a função de refresh ao arrastar
            />
          }
        />
        <Modal
                animationType='fade'
                transparent={true}
                visible={!showAdicionar}
                onRequestClose={() =>
                  this.setState({
                    showAdicionar: true,
                    showInputsAdicionar: false,
                    showInputEditar: false,
                    showInputsRemover: false,
                  })
                }
              >
                <View style={styles.ModalContainer}>
                  {/* Header com seta e título */}
                  <View style={styles.ModalHeader}>
                    <TouchableOpacity
                      style={styles.setaVoltar}
                      onPress={() =>
                          {(showInputsAdicionar||showInputEditar||showInputsRemover) ?(
                          this.setState({
                          showInputsAdicionar: false,
                          showInputEditar: false,
                          showInputsRemover: false,
                          }
                        )):(this.setState({showAdicionar:true}))
                      }}
                    >
                      <Text style={styles.setaTexto}>{'\u2190'}</Text>
                    </TouchableOpacity>
                  <View style={{flex:1,}}>
                    <Text style={styles.ModalTitulo}>{titleEnviar} Estoque Carrinho</Text>
                  </View>
                  </View>
        
                  {/* Botões de ação ou Inputs */}
                  {(!showInputsAdicionar && !showInputEditar && !showInputsRemover) ? (
                    <View style={styles.ButtonsCardapio}>
                      <Button
                        title='Adicionar'
                        onPress={() => this.setState({ showInputsAdicionar: true })}
                      />
                      <Button
                        title='Editar'
                        onPress={() => this.setState({ showInputEditar: true })}
                      />
                      <Button
                        title='Remover'
                        onPress={() => this.setState({ showInputsRemover: true })}
                      />
                    </View>
                  ) : (
                    <FlatList  
                               data={inputs} 
                                 keyExtractor={(item) => item.key}
                                 renderItem={({ item }) => (
                                   <View>
                               {item.nome==='AdicionarItem'&&(showInputEditar||showInputsRemover)?(
                                   <View style={styles.inputGroup}>
                                     <Text style={styles.inputLabel}>{item.label}</Text> 
                                     <TextInput
                                       style={styles.inputSimples}
                                       placeholder={item.label}
                                       keyboardType={item.tipoTeclado}
                                       value={this.state[item.nome]}
                                       onChangeText={(text) => {
                                         this.setState({ [item.nome]: text});
                                         this.searchEstoque(text,'dataGeralAlterar')}}
                                     />
                                     {this.state.AdicionarItem && !this.state.AdicionarEstoqueIdeal &&(
                                     <ScrollView style={{ maxHeight: 150 }}>
                                     {this.state.dataGeralAlterar.map((item,i)=>(
                                       <TouchableOpacity
                                       Key={i}
                                       style={{
                                       padding: 8,
                                       backgroundColor: '#eee',
                                       borderBottomWidth: 1,
                                       borderColor: '#ccc',
                                       }}
                                       onPress={()=>this.setState({AdicionarItem:item.item,AdicionarEstoqueIdeal:item.estoque_ideal})}
                                       >
                                       <Text>{item.item}</Text>
                                       </TouchableOpacity>
                                     ))}
                                     </ScrollView>
                             )}
                                   </View>
                              ):(
                               <View style={styles.inputGroup}>
                               <Text style={styles.inputLabel}>{item.label}</Text> 
                               <TextInput
                                 style={styles.inputSimples}
                                 placeholder={item.label}
                                 keyboardType={item.tipoTeclado}
                                 value={this.state[item.nome]}
                                 onChangeText={(text) =>this.setState({ [item.nome]: text})}
                               />
                             </View>
                              )}
                                 </View>
                                 )}
                                 ListFooterComponent={<View style={{ height: 20 }} />}
                               />
                  )}
                  {(showInputsAdicionar || showInputEditar || showInputsRemover) &&( 
                  <TouchableOpacity style={styles.botaoEnviar} onPress={()=>{this.setState({titleEnv:titleEnviar},()=>{
                  this.Enviar();
                  });
                  }}>
                  <Text style={styles.textoBotaoEnviar}>{titleEnviar}</Text>
                </TouchableOpacity>
                )}
                </View>
              </Modal>
        {showAdicionar &&(
                <TouchableOpacity style={styles.buttonAdicionar} onPress={()=> this.setState({showAdicionar:false})}>
                  <Text style={styles.buttonTexto}>+</Text>   
                </TouchableOpacity>
          )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f8f9fa',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal:7,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    marginBottom: 10,
  },
  setaVoltar:{
    left:10,
    marginRight:20,
  },
  ModalContainer:{
    backgroundColor:'white',
    marginVertical:40,
    marginHorizontal:20,
    borderRadius:10,
    borderWidth:2,
    borderColor:'black',
    flex:1,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 18,
    fontWeight: '400',
    flex:2,
    left:10,
  },
  buttonAdicionar:{
    position: 'absolute',
    width:57,
    height:57,
    bottom:20,
    right:20,
    alignItems:'center',
    backgroundColor:'black',
    borderRadius:100,
    },
  buttonTexto:{
  fontSize:40,
  fontWeight:'Arial',
  paddingBottom:4.2,
  color:'white',
  },
  quantidade:{
    width: 40,
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    marginHorizontal: 15,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  input: {
    width: 40,
    textAlign: 'center',
    borderColor: '#000',
    borderWidth: 1,
    marginHorizontal: 10,
  },
  inputEstoque: {
    height: 40,
    width:15,
    borderColor: 'gray',
    borderWidth: 1,
    marginHorizontal:5,
    borderRadius: 5,
    flex: 2,
  },
  ModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  setaTexto: {
    fontSize: 30,
    color: '#333',
  },
  ModalTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  ButtonsCardapio: {
    padding: 20,
    justifyContent: 'space-around',
    height: 200,
  },
  inputGroup: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  inputSimples: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  dropdownMock: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#f1f1f1',
  },
  dropdownText: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  dropdownOption: {
    paddingVertical: 6,
  },
  botaoEnviar: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  textoBotaoEnviar: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});