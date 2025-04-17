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

export default class ScreenCardapio extends React.Component {
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
    console.log('entrou', sugestao)
    if(sugestao.categoria_id===2){
        const instrucao=sugestao.instrucoes
        const modalidadeMatch = instrucao.match(/Modalidade:\s*([^-]+)/)
        this.setState({modalidade:modalidadeMatch?modalidadeMatch[1].trim():null})
        console.log('modalidade:', modalidadeMatch)
        const instrucaoMacth = instrucao.match(/-s*(Passo.+)/)
        this.setState({instrucao:instrucaoMacth?instrucaoMacth[1].trim():null})
        console.log(instrucaoMacth)
    }
    else if(sugestao.categoria_id===3){

    }
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
  Enviar = () =>{
    const {titleEnv}=this.state
    this.socket.emit('Alterar_cardapio',{tipo:titleEnv,categoria,modalidade,item:AdicionarItem, preco:AdicionarPreco, frutas, tamanho,  instrucao, adicionais,novoNome:AdicionarNovoNome})
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
          { key: 'Frutas:', label: 'Ex: (abacaxi-banana-melancia)',categoria:'Bebida' },
          { key: 'Instrucoes:', label: 'Ex: (Passo 1:  corta banana-Passo 2:30ml de cachaça-Passo 3: mexer bastante',categoria:'Bebida' },
          { key: 'Tamanho:', label: 'Ex: (300g-500g+20-1kg+75)',categoria: 'Porção' },
          { key: 'Adicionais:', label: 'Ex: (cheddar E bacon+18-cebola empanada+15)', categoria:'Porção' },
          { key: 'modalidade', label: 'Modalidade',categoria:'Bebida'},
        ];
        titleEnviar = "Adicionar";
      } else if (showInputEditar) {
        inputs = [
          { key: 'Nome', label: 'Nome do Item',nome:"AdicionarItem",tipoTeclado:'default'},
          { key: 'Novo nome', label: 'Novo Nome do Item',nome:"AdicionarNovoNome",tipoTeclado:'default'},
          { key: 'Preco:', label: 'Preco',nome:"AdicionarPreco",tipoTeclado:'numeric' },
          { key: 'categoria', label: 'Categoria'},
          { key: 'Tamanho', label: 'Ex: (300g-500g+20-1kg+75)',nome:'tamanho',categoria: 'Porção' },
          { key: 'Adicionais', label: 'Ex: (cheddar E bacon+18-cebola empanada+15)',nome:'adicionais', categoria:'Porção' },
          { key: 'Frutas', label: 'Ex: (abacaxi-banana-melancia)',categoria:'Bebida',nome:'frutas' },
          { key: 'Instrucoes', label: 'Ex: (Passo 1:  corta banana-Passo 2:30ml de cachaça-Passo 3: mexer bastante',nome:'instrucao',categoria:'Bebida' },
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
                    <FlatList
                    data={inputs.filter(item=> !item.categoria || item.categoria===this.state.categoria)}    
                    keyExtractor={(item) => item.key}
                      renderItem={({ item }) => (
                        <View style={styles.inputGroup}>
                          {/* Categoria e Modalidade como dropdown mock */}
                          {(item.key === 'categoria' || (item.key === 'modalidade' && this.state.categoria==='Bebida')) ? (
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
                                        onPress={() => {op===this.state.categoria ?(
                                            this.setState({[item.key]:''})
                                        ):(this.setState({ [item.key]: op }))}}
                                        >
                                        <Text style={selecionado ? styles.dropdownTextoSelecionado : null}>{op}</Text>
                                        </TouchableOpacity>
                                    );
                                
                                    })}
                                </View>
                                ) : 
                                    (item.nome === 'AdicionarItem'&&(showInputEditar||showInputsRemover)) ? (
                                        <>
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
                                          {(this.state.AdicionarItem && !this.state.AdicionarPreco)&&
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
                                        </>
                                      ) : (
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
