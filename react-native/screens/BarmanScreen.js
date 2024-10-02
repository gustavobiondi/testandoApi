import React from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import io from 'socket.io-client';

export default class BarmanScreen extends React.Component {
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
      this.setState({ data: dados.filter(item => item.categoria === 'drink') });
    });

    // Ouvir novos pedidos em tempo real
    this.socket.on('new_order', (newOrder) => {
      if (newOrder.categoria === 'drink') {
        this.setState((prevState) => ({
          data: [...prevState.data, newOrder]
        }));
      }
    });

    // Ouvir quando uma comanda for deletada
    this.socket.on('comanda_deleted', ({ fcomanda }) => {
      this.setState((prevState) => ({
        data: prevState.data.filter(item => item.comanda !== fcomanda)
      }));
    });
  }

  componentWillUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Comanda</Text>
          <Text style={styles.headerText}>Pedido</Text>
        </View>
        <FlatList
          data={this.state.data}
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <Text style={styles.itemText}>{item.comanda}</Text>
              <Text style={styles.itemText}>{item.pedido}</Text>
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
