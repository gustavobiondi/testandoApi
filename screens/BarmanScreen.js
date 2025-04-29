import React from 'react';
import { View, FlatList, Text, StyleSheet, Button,RefreshControl,Modal,TouchableOpacity } from 'react-native';
import io from 'socket.io-client';
import { API_URL } from "./url";
import notifee from "@notifee/react-native" 

export default class BarmanScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      data_filtrado: [],
      showFiltrado: true,
      ingredientes: [],
      refreshing:false,
      showModal:false, // Inicializa como um array vazio
    };
    this.refreshData = this.refreshData.bind(this);
    this.alterar_estado = this.alterar_estado.bind(this);
    this.filtrar = this.filtrar.bind(this);
    this.extra = this.extra.bind(this);
  }

  componentDidMount() {
    this.socket = io(`${API_URL}`);
    const handleDisplayNottification =  async ()=>{
      //create channel
    const channelId =  await notifee.createChannel({
      id:'default-V2',
      name:'Default Channel',
      sound:'default',
      importance: notifee.AndroidImportance.HIGH
      
    });
    //display notification
    }
    handleDisplayNottification()
    // Ouvir eventos de dados iniciais
    this.socket.emit('getPedidos',false)
    this.socket.on('respostaPedidos', async (dados) => {
      console.log(dados)
      if(dados.dataPedidos){
      const data_temp = dados.dataPedidos.filter(item => item.categoria === '2');
      this.setState({ data: data_temp});

      const data_temp_filtrado = data_temp.filter(item => item.estado !== "Pronto");
      this.setState({ data_filtrado: data_temp_filtrado });
      
      await notifee.displayNotification({
        title:'Hello',
        body:'local notification',
        android:{
         channelId:'default',
         importance: notifee.AndroidImportance.HIGH,
         pressAction:{
          id:'default',
         }
        }
      })
    }
  })
    this.socket.on('ingrediente', ({data}) => {
      console.log(data)
      this.setState({ ingredientes: data});
    });
}

  refreshData(){
    
    this.setState({ refreshing: true });
    this.socket.emit('getPedidos')

      // Inicializar showExtra e ingredientes com arrays do mesmo tamanho de data_temp
      this.setState({ 
        refreshing:false,
      });
    }

  componentWillUnmount() {
    this.socket.off('getPedidos');
    this.socket.off('ingrediente');
  }

  alterar_estado(id, estado) {
    this.socket.emit('inserir_preparo', { id, estado });
  }

  filtrar = () => {
    this.setState(prevState => ({
      showFiltrado: !prevState.showFiltrado
    }));
  }

  // Método para alternar a visualização do "extra" e buscar ingredientes
  extra(index) {
    const { data_filtrado } = this.state;
    this.setState(prevState => ({showModal:!prevState.showModal }));
    this.socket.emit('get_ingredientes', { ingrediente: data_filtrado[index].pedido});
  }

  render() {
    const dataToShow = this.state.showFiltrado
      ? this.state.data_filtrado
      : this.state.data;
    const {refreshing} = this.state
    return (
      <View style={styles.container} >
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Pedido</Text>
          <Text style={styles.headerText}>Horario Envio</Text>
          <Button
            title={this.state.showFiltrado ? 'Todos' : 'Filtrar'}
            onPress={this.filtrar}
          />
        </View>
        
        <FlatList
          data={dataToShow}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View >
                <View style={styles.tableRow}>
                  <Text style={styles.itemText}>
                {item.quantidade} {item.pedido} {item.extra} ({item.comanda})
              </Text>
                  <Button title="+" onPress={() => this.extra(index)} />
                  <Text style={styles.itemText}>{item.inicio}</Text>
         
                  {item.estado === 'Em Preparo' ? (
                    <Button
                      title="Terminar"
                      color={'green'}
                      onPress={() => this.alterar_estado(item.id, 'Pronto')}
                    />
                  ) : item.estado === 'A Fazer' ? (
                    <Button
                      title="Começar"
                      color={'blue'}
                      onPress={() => this.alterar_estado(item.id, 'Em Preparo')}
                    />
                  ) : (
                    <Button
                      title="Desfazer"
                      color={'red'}
                      onPress={() => this.alterar_estado(item.id, 'A Fazer')}
                    />
                  )}
                </View>
            </View>
          )}
          

          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={this.refreshData} // Chama a função de busca ao arrastar para baixo
            />
          }
        />
        
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.showModal}
          onRequestClose={() => this.setState({ showModal: false })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <FlatList
              data={this.state.ingredientes}
              keyExtractor={(item,index)=>index.toString()}
              renderItem={({item,index})=>(
                <View style={{justifyContent:'center'}}>
                <View style={{flexDirection:'row'}}>
                <Text>{item.key}   :   {item.dado}</Text>
                </View>
                <Text>     -------------     </Text>
                </View>

              )}
              />
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => this.setState({ showModal: false,ingredientes:[]})}
              >
                <Text style={styles.buttonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
  
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#FF6347',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  headerText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
  },
});
