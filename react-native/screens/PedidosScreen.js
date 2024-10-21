
import React from 'react';
import { View, FlatList, Text, StyleSheet, Button } from 'react-native';
import io from 'socket.io-client';

export default class PedidosScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
    };
  }

  componentDidMount() {
    this.socket = io('http://192.168.15.16:5000');

    // Ouvir eventos de dados iniciais
    this.socket.on('initial_data', (dados) => {
      this.setState({ data:dados.dados_pedido});
      console.log(dados)
    });


  }
  componentWillUnmount() {
    this.socket.off('initial_data');
  }


  render() {

    return (
      <View style={styles.container}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Comanda</Text>
          <Text style={styles.headerText}>Pedido</Text>
          <Text style={styles.headerText}>Horario Envio</Text>
          <Text style={styles.headerText}>User</Text>
        </View>
        <FlatList
          data={this.state.data}
          renderItem={({ item,index }) => (
            <View style={styles.tableRow}>
              <Text style={styles.itemText}>{item.comanda}</Text>
              <Text style={styles.itemText}>{item.pedido}</Text>
              <Text style={styles.itemText}>{item.inicio}</Text>
              <Text style={styles.itemText}>{item.username}</Text>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
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