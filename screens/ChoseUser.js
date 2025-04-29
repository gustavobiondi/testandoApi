import React, { useContext } from 'react';
import { FlatList, View, StyleSheet, Text, RefreshControl, Button,TouchableOpacity ,Modal, Alert} from 'react-native';
import { UserContext } from '../UserContext'; // Import the UserContext
import { API_URL } from "./url";
import { Picker } from "@react-native-picker/picker";
import io from 'socket.io-client';

export default class ChoseUser extends React.Component {
  static contextType = UserContext;

  constructor(props) {
    super(props);
    this.state = {
      data: [], // Lista de dados de usuários// Define se o usuário tem permissão para ver a lista
      refreshing: false, // Estado para o controle de pull-to-refresh
      showModal:false,
      editCargo:'',
      usuarioSelected:'',
      cargoUsuarioSelected:'',
      senhaUsuarioSelected:'',
      remover:'',
      idUsuarioSelected:'',
      cargoUsuarioSelected: '',
      cargos: [ 'Colaborador', 'ADM', 'Entregador', 'Cozinha' ]
    };
  }

  componentDidMount() {
    const { user } = this.context;   
    
    this.fetchUsers();
  }

  
  fetchUsers = () => {
    const { user } = this.context;
    
    this.setState({ refreshing: true });
    this.socket = io(`${API_URL}`)
    this.socket.emit('users',false)
    this.socket.on('usuarios',(data) => {
      if (data){
      this.setState({ data: data.users, refreshing: false });
      }
    })
    
  };

  Liberar = (id, numero) => {
    this.socket.emit('permitir', { id, numero })
  };
  Remover(){
    const {idUsuarioSelected} = this.state
    this.socket.emit('Delete_user',{id:idUsuarioSelected})
    this.setState({idUsuarioSelected:'',cargoUsuarioSelected:'',senhaUsuarioSelected:'',showModal:false,usuarioSelected:''})
  }
  render() {
    const { data,refreshing,showModal } = this.state;

    const { cargoUsuarioSelected, cargos } = this.state;

    return (
      <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <Text style={styles.userInfo}>👤 {item.username}</Text>
            <View style={styles.buttonRow}>
              {item.liberado === '0' ? (
                <TouchableOpacity
                  style={styles.liberar}
                  onPress={() => this.Liberar(item.id, '1')}
                >
                  <Text style={styles.buttonText}>Liberar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.bloquear}
                  onPress={() => this.Liberar(item.id, '0')}
                >
                  <Text style={styles.buttonText}>Bloquear</Text>
                </TouchableOpacity>
              )}
              {!showModal && (
            <TouchableOpacity
                  style={styles.editar}
                  onPress={() => this.setState({showModal:true,usuarioSelected:item.username,cargoUsuarioSelected:item.cargo,senhaUsuarioSelected:item.senha,idUsuarioSelected:item.id})}
                >
                  <Text style={styles.buttonText}>Editar</Text>
            </TouchableOpacity>
              )}
            </View> 
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={this.fetchUsers}
          />
        }
      />
      <Modal
      animationType='fade'
      trasnparent={true}
      visible={showModal}
      onRequestClose={()=> this.setState({showModal:false})}
      >
        <View style={styles.ModalContainer}>
          <View style={styles.ModalHeader}>
          <TouchableOpacity
              style={styles.setaVoltar}
              onPress={() =>
                  this.setState({
                    showModal:false,
                    })}
            >
              <Text style={styles.setaTexto}>{'\u2190'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerText}>Usuario: 👤 {this.state.usuarioSelected}</Text>
          </View>
          <Picker
          selectedValue={cargoUsuarioSelected}
          onValueChange={value => this.setState({ cargoUsuarioSelected: value })}
          style={styles.picker}
        >
          <Picker.Item
            label={cargoUsuarioSelected || 'Selecionar Cargo'}
            value={cargoUsuarioSelected || ''}
          />
          
          {cargos
            .filter(item => item !== cargoUsuarioSelected)
            .map(item => (
              <Picker.Item key={item} label={item} value={item} />
            ))
          }
        </Picker>
      
      <Button title='Remover' onPress={()=>{
        Alert.alert(
          "Remover usuario?",
          "Tem certeza que deseja remover este usuario?",
          [
            {text:'Cancelar',style:"cancel"},
            {text:'REMOVER', onPress: ()=> this.Remover()}
          ]
        )
      }}/>
      
          </View>
        </Modal> 
    </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3, // Android sombra
    shadowColor: '#000', // iOS sombra
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
  },
  liberar: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  bloquear: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  editar:{
    backgroundColor: 'blue',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
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
  headerText:{
    fontSize: 22,
    fontWeight:'bold',
    marginLeft: 16,
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
  setaVoltar:{
    left:10,
    marginRight:20,
  },
  picker: {
    height: 50,
    width: '100%',
  },
});
