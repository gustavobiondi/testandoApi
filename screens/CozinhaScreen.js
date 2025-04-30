import React from 'react';
import { View, FlatList, Text, StyleSheet, Button, RefreshControl, } from 'react-native';
import io from 'socket.io-client';
import { API_URL } from "./url";

export default class Cozinha extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      data_filtrado: [],
      showFiltrado: false,
      refreshing: false, // Estado para gerenciar o "pull-to-refresh"
    };
    this.refreshData = this.refreshData.bind(this);
  }

  componentDidMount() {
    this.refreshData();
  }

  refreshData() {
    this.setState({ refreshing: true });
    this.socket = io(`${API_URL}`);

    // Ouvir eventos de dados iniciais
    this.socket.emit('getPedidos',false)
    this.socket.on('respostaPedidos', (dados) => {
      if(dados.dataPedidos){
      const data_temp = dados.dataPedidos.filter(item => item.categoria === '3');
      const data_temp_filtrado = data_temp.filter(item => item.estado !== "Pronto");
        
      this.setState({
        data: data_temp,
        data_filtrado: data_temp_filtrado,
        refreshing: false,
      });}
    });
  }

  componentWillUnmount() {
    if (this.socket) {
      this.socket.off('getPedidos');
    }
  }

  alterar_estado(id, estado) {
    this.socket.emit('inserir_preparo', { id, estado });
  }

  filtrar = () => {
    this.setState(prevState => ({
      showFiltrado: !prevState.showFiltrado,
    }));
  };

  render() {
    const dataToShow = this.state.showFiltrado
      ? this.state.data
      : this.state.data_filtrado;

    return (
      <View style={styles.container}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Comanda</Text>
          <Text style={styles.headerText}>Pedido</Text>
         
          {this.state.showFiltrado ? (
            <Button title="Filtrar" onPress={this.filtrar} />
          ) : (
            <Button title="Todos" onPress={this.filtrar} />
          )}
        </View>
        <FlatList
          data={dataToShow}
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <Text style={styles.itemText}>{item.comanda}</Text>
              <Text style={styles.itemText}>{item.pedido} {item.extra}</Text>
            
              {item.estado === "Em Preparo" ? (
                <View>
                <Button color='orange' title="Pronto" onPress={() => this.alterar_estado(item.id, 'Pronto')} />
                  </View>
              ) : item.estado === "A Fazer" ? (
                <Button color='blue'title="Começar" onPress={() => this.alterar_estado(item.id, 'Em Preparo')} />
              ) : (
                <Button color='green'title="Desfazer" onPress={() => this.alterar_estado(item.id, 'A Fazer')} />
              )}
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.refreshData} // Chama o método de atualização ao puxar para baixo
            />
          }
        />
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