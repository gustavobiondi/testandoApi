import React from 'react';
import { View, FlatList, Text, StyleSheet, Button, TextInput, Modal, TouchableOpacity } from 'react-native';
import io from 'socket.io-client';

export default class PedidosScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      showEditar: false,
      pedidosAlterados: [],
      dados_antigos: [],
      showModal: false,
      pedidoModal: {},
      editable: false,
    };
  }

  componentDidMount() {
    this.socket = io('http://192.168.15.16:5000');
    this.socket.on('initial_data', (dados) => {
      console.log(dados);
      this.setState({ data: dados.dados_pedido });
    });
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  alterarPedido = (campo, valor) => {
    this.setState(prevState => ({
      pedidoModal: { ...prevState.pedidoModal, [campo]: valor }
    }));
  };

  abrirModal = (item) => {
    this.setState({ pedidoModal: item, showModal: true,});
  };

  handleConfirmar = () => {
    
    this.socket.emit('atualizar_pedidos', {'pedidoAlterado':this.state.pedidoModal});
    this.setState({editable:false, pedidoModal:{},showModal:false})
    
  };

  handleCancelar = () => {
    this.setState({ data: this.state.dados_antigos, showEditar: false });
  };

  render() {
    const { data } = this.state;
    return (
      <View style={styles.container}>
        {!this.state.showEditar ? (
          <Button title="Editar" onPress={() => this.setState({ showEditar: true, dados_antigos: data })} />
        ) : (
          <View style={styles.editButtons}>
            <Button title="Cancelar" color="red" onPress={this.handleCancelar} />
            <Button title="Confirmar" onPress={this.handleConfirmar} />
          </View>
        )}
        
      
        
        <FlatList
          data={this.state.data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <TouchableOpacity
                onPress={() => this.abrirModal(item)}
                style={styles.itemContainer}
              >
                <Text style={styles.itemText}>
                  {item.quantidade} {item.pedido} ({item.comanda}) - {item.inicio}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
        
        {/* Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.showModal}
          onRequestClose={() => this.setState({ showModal: false })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Botões de Edição */}
              {this.state.editable ? (
              <TouchableOpacity
              style={[styles.EitButton,{backgroundColor:'green'}]}
              onPress={this.handleConfirmar}
              >
              <Text style={styles.buttonText}>Confirmar</Text>
              </TouchableOpacity>
              ) : (
                <TouchableOpacity
                style={[styles.EitButton,{backgroundColor:'blue'}]}
                onPress={() => this.setState({ editable:true })}
              >
                <Text style={styles.buttonText}>Editar</Text>
              </TouchableOpacity>
             )}

              {/* Campos de Edição */}
              {["comanda", "pedido", "quantidade", "extra", "preco"].map((campo) => (
              
                <View key={campo} style={{flexDirection:'row',alignItems:'center'}}>
                <Text>{campo}: </Text>
                <TextInput
                  style={styles.modalInput}
                  value={String(this.state.pedidoModal[campo] || '')}
                  editable={this.state.editable}
                  onChangeText={(text) => this.alterarPedido(campo, text)}
                  placeholder={`Digite ${campo}`}
                />
                </View>
              ))}

              {/* Botão para Fechar o Modal */}
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => this.setState({ showModal: false, editable:false})}
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
  editButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    width: '100%',
  },
  itemText: {
    textAlign: 'center',
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
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  modalInput: {
    width: '70%',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 5,
    borderRadius: 5,
  },
  closeButton: {
    backgroundColor: '#FF6347',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  EitButton: {
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

