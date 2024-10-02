import React from 'react';
import { FlatList, View, Text, StyleSheet, Button, TextInput } from 'react-native';
import io from 'socket.io-client';

class ComandaScreen extends React.Component {
  constructor(props) {
    super(props);
    const { data, fcomanda, preco } = this.props.route.params;
    this.state = {
      data: data.filter(item => item.comanda === fcomanda),
      fcomanda,
      preco,
      valor_pago: null, // Valor inicial do valor_pago
    };
  }

  componentDidMount() {
    this.socket = io('http://127.0.0.1:5000');

    this.socket.on('new_order', (newOrder) => {
      if (newOrder.comanda === this.state.fcomanda) {
        this.setState((prevState) => ({
          data: [...prevState.data, newOrder],
          preco: prevState.preco + newOrder.preco || 0,
        }));
      }
    });

    this.socket.on('comanda_deleted', ({ fcomanda }) => {
      if (fcomanda === this.state.fcomanda) {
        this.setState({ data: [], preco: 0 });
      }
    });

    this.socket.on('error', ({ message }) => {
      console.error('Erro do servidor:', message);
    });
  }

  componentWillUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  apagarComanda = () => {
    const { fcomanda } = this.state;
    this.socket.emit('delete_comanda', { fcomanda });
  }

  changeValor = (valor_pago) => {
    this.setState({ valor_pago });
  }

  pagarParcial = () => {
    const { valor_pago, fcomanda } = this.state;
    this.socket.emit('pagar_parcial', { valor_pago, fcomanda });
    this.setState(prevState=>({
          preco:prevState.preco-valor_pago,
          valor_pago: 0
        }))
    }
  

  render() {
    const { data, preco } = this.state;

    return (
      <View style={styles.container}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Comanda</Text>
          <Text style={styles.headerText}>Pedido</Text>
        </View>

        <FlatList
          data={data}
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <Text style={styles.itemText}>{item.comanda}</Text>
              <Text style={styles.itemText}>{item.pedido}</Text>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />

        <View style={styles.summary}>
          <Text style={styles.totalText}>PREÇO TOTAL</Text>
          <Text style={styles.totalValue}>{preco}</Text>
          <Button title='Tudo Pago' onPress={this.apagarComanda}/>

          <TextInput
            placeholder="quanto"
            onChangeText={(text) => this.changeValor(text)}
            value={this.state.valor_pago}
          />
          <Button title='Pagar Parcial' onPress={this.pagarParcial}/>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
    backgroundColor: '#f7f7f7',
  },
  headerText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
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
    textAlign: 'left',
  },
  summary: {
    marginTop: 20,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 24,
    marginVertical: 10,
  },
});

export default ComandaScreen;
