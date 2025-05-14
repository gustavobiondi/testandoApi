import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Button,
  TextInput,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import io from 'socket.io-client';
import { API_URL } from './url';
import { style } from 'twrnc';
import { UserContext } from '../UserContext';

export default class ScreenCardapio extends React.Component {
 get defaultOpcoes(){
  return [
    {
      titulo: '',
      conteudo: ['']
    }
  ];
} 
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      dataGeral:[],
      dataCardapio: [],
      showMaisInfo: false,
      cardapio: '',
      data:[],
      showAdicionar:true, 
      showInputsAdicionar:false,
      showInputsRemover:false,
      showInputEditar:false,
      AdicionarItem:"",
      AdicionarPreco:'',
      AdicionarNovoNome:"",
      titleEnv:'',
      categoria:'',
      modalidade:'',
      adicionais:'',
      frutas:'',
      tamanho:'',
      instrucao:'',
      selecionado:[],
      opcoes:[
        {
          titulo:'',
          conteudo:['']
        }
      ]
    };
  }

  componentDidMount() {
    this.socket = io(`${API_URL}`);
    this.initializeData();
  }

  initializeData() {
    this.socket.emit('getCardapio',false)
    this.socket.on('respostaCardapio', (data) => {
      
      if (data.dataCardapio) {
        this.setState({ dataCardapio: data.dataCardapio,data:data.dataCardapio,dataGeral:data.dataCardapio});
      }
    });
  }
  getDados(sugestao){ 
    this.socket.emit('getItemCardapio',{item:sugestao.item})
    this.socket.once('respostaGetItemCardapio',(data)=>{
      if (data.opcoes){
        this.setState({opcoes:data.opcoes})
      }
  })
  }
  
  searchEstoque = (text,data) => {
    if (text){
    const normalizedEstoque = text.toLowerCase();
    if (normalizedEstoque && this.state.dataCardapio) {
      const dataFiltrado = this.state.dataCardapio.filter((item) =>
        item.item.toLowerCase().startsWith(normalizedEstoque)
      );
      this.setState({ cardapio:text, [data]: dataFiltrado });
    } else {
      this.setState({ cardapio:text, [data]: this.state.dataCardapio || [] });
    }
    }
    else{
        this.setState({cardapio:text,[data]:this.state.dataCardapio})
    }
  };
  adicionarOpcao = () => {
    this.setState((prevState) => ({
      opcoes: [...prevState.opcoes, { titulo: '', conteudo: [''] }]
    }));
  };
  removerConteudo = (opcaoIndex, conteudoIndex) => {
    const novasOpcoes = [...this.state.opcoes];
    novasOpcoes[opcaoIndex].conteudo.splice(conteudoIndex, 1);
    this.setState({ opcoes: novasOpcoes });
  };
  
  removerOpcao = (opcaoIndex) => {
    const novasOpcoes = [...this.state.opcoes];
    novasOpcoes.splice(opcaoIndex, 1);
    this.setState({ opcoes: novasOpcoes });
  };
  
  adicionarConteudo = (index) => {
    const novasOpcoes = [...this.state.opcoes];
    novasOpcoes[index].conteudo.push('');
    this.setState({ opcoes: novasOpcoes });
  };
  atualizarTitulo = (index, texto) => {
    const novasOpcoes = [...this.state.opcoes];
    novasOpcoes[index].titulo = texto;
    this.setState({ opcoes: novasOpcoes });
  };
  
  atualizarConteudo = (opcaoIndex, conteudoIndex, texto) => {
    const novasOpcoes = [...this.state.opcoes];
    novasOpcoes[opcaoIndex].conteudo[conteudoIndex] = texto;
    this.setState({ opcoes: novasOpcoes });
  };
  Enviar = () =>{
    const {categoria,modalidade,AdicionarItem,AdicionarPreco,opcoes,titleEnv,AdicionarNovoNome}=this.state
    const {user} =  this.context
    console.log(this.state.opcoes)
    if(titleEnv==='Adicionar'){
    this.socket.emit('adicionarCardapio',{categoria,modalidade,item:AdicionarItem, preco:AdicionarPreco,opcoes:opcoes,username:user.username,token:user.token})
    }
    else if(titleEnv==='Editar'){
      this.socket.emit('editarCardapio',{categoria,modalidade,item:AdicionarItem, preco:AdicionarPreco,novoNome:AdicionarNovoNome,opcoes:opcoes,username:user.username,token:user.token})
    }
    else if (titleEnv==='Remover'){
      this.socket.emit('removerCardapio',{item:AdicionarItem,username:user.username,token:user.token})
    }
    this.setState({categoria:'',modalidade:'', AdicionarItem:'',  AdicionarPreco:'', frutas:'', tamanho:'', instrucao:'', adicionais:'', AdicionarNovoNome:''})
  }

  render() {
    const { dataCardapio, showMaisInfo, cardapio,data } = this.state;
    const {
        showAdicionar,
        showInputsAdicionar,
        showInputEditar,
        showInputsRemover,
        titleEnv,
      } = this.state;
      let inputs=[];
      let titleEnviar='';
      if (showInputsAdicionar) {
            inputs = [
          { key: 'Nome:', label: 'Nome do Item',nome:"AdicionarItem",tipoTeclado:'default'},
          { key: 'Preco:', label: 'Preco',nome:"AdicionarPreco",tipoTeclado:'numeric' },
          { key: 'categoria', label: 'Categoria'},
          { key: 'modalidade', label: 'Modalidade',categoria:'Bebida'},
        ];
        titleEnviar = "Adicionar";
      } else if (showInputEditar) {
        inputs = [
          { key: 'Nome', label: 'Nome do Item',nome:"AdicionarItem",tipoTeclado:'default'},
          { key: 'Novo nome', label: 'Novo Nome do Item',nome:"AdicionarNovoNome",tipoTeclado:'default'},
          { key: 'Preco:', label: 'Preco',nome:"AdicionarPreco",tipoTeclado:'numeric' },
          { key: 'categoria', label: 'Categoria'},
          { key: 'modalidade', label: 'Modalidade',categoria:'Bebida'},
        ];
        titleEnviar = "Editar";
      } else if (showInputsRemover) {
        inputs = [
          { key: 'Nome', label: 'Nome do Item',nome:"AdicionarItem",keyboardType:'default'},
        ];
        titleEnviar = "Remover";
      }
      const opcoesCategoria = ['Restante', 'Bebida', 'Porção'];
      const opcoesModalidade = ['Coqueteleira', 'Montado', 'Liquidificador','Montado na taça','Montado no copo'];

    return (
      <View style={{ flex: 1, padding: 10 }}>
        <View style={styles.container}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerTitle}>ITEM</Text>
            <TextInput
              style={styles.inputEstoque}
              placeholder="Buscar item..."
              onChangeText={(cardapio)=>this.searchEstoque(cardapio,'data')}
              value={cardapio}
            />
          </View>

          <View style={[styles.tableRow, styles.headerRow]}>
            <Text style={[styles.itemText, styles.headerText]}>Item</Text>
            <Text style={[styles.cellheader, styles.headerText]}>Preço</Text>
          </View>
        </View>

        <ScrollView style={{ marginTop: 10 }}>
          {data &&
            data.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.itemText}  ellipsizeMode="tail">
                  {item.item}
                </Text>
                <Text style={styles.cell}   ellipsizeMode="tail">
                  {item.preco}
                </Text>
                <Button
                  title="+"
                  onPress={() => this.setState({ showMaisInfo: true })}
                />
              </View>
            ))}
            
        </ScrollView>
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
                    opcoes:this.defaultOpcoes,
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
                          AdicionarItem:"",
                          AdicionarPreco:'',
                          AdicionarNovoNome:"",
                          categoria:'',
                          modalidade:'',
                          adicionais:'',
                          frutas:'',
                          tamanho:'',
                          instrucao:'',
                          opcoes:this.defaultOpcoes,
                          }
                        )):(this.setState({showAdicionar:true}))
                      }}
                    >
                      <Text style={styles.setaTexto}>{'\u2190'}</Text>
                    </TouchableOpacity>
                  <View style={{flex:1,}}>
                    <Text style={styles.ModalTitulo}>{titleEnviar} Cardapio</Text>
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
                        onPress={() => {this.setState({ showInputEditar: true })}}
                      />
                      <Button
                        title='Remover'
                        onPress={() => this.setState({ showInputsRemover: true })}
                      />
                    </View>
                  ) : (
                    <ScrollView>
                     {inputs
                      .filter(item => !item.categoria || item.categoria === this.state.categoria)
                      .map((item, index) => (
                        <View key={`input-${index}`} style={styles.inputGroup}>
                          {/* Categoria e Modalidade como dropdown mock */}
                        {(item.key !== 'categoria' && item.key !== 'modalidade' && (showInputsAdicionar || item.key!=='Nome')) ?(
                          <View>
                                    <Text style={styles.inputLabel}>{item.key}</Text>
                                <TextInput  
                                    style={styles.inputSimples}
                                    placeholder={item.label}
                                    keyboardType={item.tipoTeclado}
                                    value={this.state[item.nome]}
                                    onChangeText={(text) =>this.setState({ [item.nome]: text })}
                                />
                                </View>
                          ) : (item.key==='categoria' || (item.key==='modalidade' && this.state.categoria==='Bebida')) &&(
                                <View style={styles.dropdownMock}>
                                     <Text style={styles.inputLabel}>{item.label}</Text>
                                    <Text style={styles.dropdownText}>Selecionar {item.key}</Text>

                                    {(item.key === 'categoria' ? opcoesCategoria : opcoesModalidade).map((op, idx) => {
                                    const selecionado = this.state[item.key] === op;
                                
                                    return (
                                        <TouchableOpacity
                                        key={idx}
                                        style={[
                                            styles.dropdownOption,
                                           selecionado && styles.dropdownOptionSelecionado
                                        ]} 
                                        onPress={() => 
                                            
                                        this.setState({ [item.key]: op, opcoes:this.defaultOpcoes })}
                                        >
                                        <Text style={selecionado ? styles.dropdownTextoSelecionado : null}>{op}</Text>
                                        </TouchableOpacity>
                                    );
                                
                                    })}
                                </View>
                          )}
                                   {(item.nome === 'AdicionarItem'&&(showInputEditar||showInputsRemover)) && (
                                        <View>
                                          <Text style={styles.inputLabel}>{item.key}</Text>
                                          <TextInput
                                            style={styles.inputSimples}
                                            placeholder={item.label}
                                            keyboardType={item.tipoTeclado}
                                            value={this.state[item.nome]}
                                            onChangeText={(text) => {
                                              this.setState({ [item.nome]: text,AdicionarPreco:'',categoria:''});
                                              this.searchEstoque(text,'dataGeral'); // filtrar sugestões
                                            }}
                                          />
                                          {(!!this.state.AdicionarItem && !this.state.AdicionarPreco)&&
                                          <ScrollView style={{ maxHeight: 150 }}>
                                            {this.state.dataGeral.map((sugestao, idx) => (
                                              <TouchableOpacity
                                                key={idx}
                                                style={{
                                                  padding: 8,
                                                  backgroundColor: '#eee',
                                                  borderBottomWidth: 1,
                                                  borderColor: '#ccc',
                                                }}
                                                onPress={() =>{
                                                  this.setState({
                                                    [item.nome]: sugestao.item,
                                                    AdicionarPreco:sugestao.preco,
                                                    categoria:sugestao.categoria_id===1?'Restante':sugestao.categoria_id===2?'Bebida':'Porção' // limpa sugestões
                                                  })
                                                this.getDados(sugestao)
                                                }
                                                }
                                              >
                                                <Text>{sugestao.item}</Text>
                                              </TouchableOpacity>
                                            ))}
                                            
                                          </ScrollView>

                                          
                                          
                                
                                }
                                </View>)}
                                
                        </View>
                  ))}
                        {!showInputsRemover && !!this.state.categoria && this.state.categoria!=='Restante'&& (
                   <View style={{ padding: 15 }}>

  { this.state.opcoes.map((opcao, opcaoIndex) => (
    <View
      key={`opcao-${opcaoIndex}`}
      style={{
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 20,
        borderRadius: 8,
      }}
    >
      <Text style={styles.inputLabel}>Título da Seção</Text>
      <TextInput
        style={styles.inputSimples}
        placeholder="Digite o título"
        value={opcao.titulo}
        onChangeText={(text) => this.atualizarTitulo(opcaoIndex, text)}
      />

      <Text style={[styles.inputLabel, { marginTop: 10 }]}>Conteúdos:</Text>

      {opcao.conteudo.map((conteudo, conteudoIndex) => {
  const ehUltimo = conteudoIndex === opcao.conteudo.length - 1;
  return (
    <View
      key={`opcoes-${opcaoIndex}-conteudo-${conteudoIndex}`}
      style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
    >
      <TextInput
        style={[styles.inputSimples, { flex: 1, marginRight: 10 }]}
        placeholder="Digite o conteúdo"
        value={conteudo}
        onChangeText={(text) =>
          this.atualizarConteudo(opcaoIndex, conteudoIndex, text)
        }
      />
      <TouchableOpacity
        onPress={() =>
          ehUltimo
            ? this.adicionarConteudo(opcaoIndex)
            : this.removerConteudo(opcaoIndex, conteudoIndex)
        }
        style={{
          backgroundColor: ehUltimo ? '#000' : '#ff3b30',
          padding: 10,
          borderRadius: 100,
        }}
      >
        <Text style={{ color: 'white', fontSize: 18 }}>
          {ehUltimo ? '+' : '-'}
        </Text>
      </TouchableOpacity>
    </View>
  );
})}

      <TouchableOpacity
        onPress={this.adicionarOpcao}
        style={{
          marginTop: 10,
          alignSelf: 'flex-start',
          backgroundColor: '#007bff',
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 5,
        }}
      >
        <Text style={{ color: 'white' }}>+ Nova Seção</Text>
      </TouchableOpacity>
      {this.state.opcoes.length>1 &&(
      <TouchableOpacity
  onPress={() => this.removerOpcao(opcaoIndex)}
  style={{
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#ff3b30',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  }}
>
  <Text style={{ color: 'white' }}>Remover Seção</Text>
</TouchableOpacity>
)}
    </View>
  ))}
</View>   )}
                    
            <View style={{ height: 20 }} />
            </ScrollView>

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
    marginBottom: 10,
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
  dropdownOptionSelecionado: {
    backgroundColor: '#2196F3',
    borderRadius: 6,
  },
  dropdownTextoSelecionado: {
    color: 'white',
    fontWeight: 'bold',
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
  cellheader:{
    width:60,
    fontSize: 18,
    fontWeight: '400',
    textAlign:'center',
    marginRight:75,
  },
  itemText:{
    fontSize: 18,
    fontWeight: '400',
    flex:2,
    left:10,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
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
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 8,
  },
  headerRow: {
    backgroundColor: '#f2f2f2',
  },
  cell: {
    width:40,
    fontSize: 18,
    fontWeight: '400',
    textAlign:'center',
    marginHorizontal:60,
  },
  headerText: {
    fontWeight: 'bold',
  },
  header:{
    fontSize: 18,
    fontWeight: 'bold',
    paddingRight: 100,
  },
  infoBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 6,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
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