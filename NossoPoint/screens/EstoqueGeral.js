import React from 'react';
import { View, FlatList, Text, StyleSheet, Button, TextInput, RefreshControl } from 'react-native';
import io from 'socket.io-client';

export default class EstoqueGeral extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      dataGeral: [],
      showEditar: false,
      itensAlterados: [],
      estoque: '',
      refreshing: false,  // Adicionando o estado de refresh
    };
    this.refreshData = this.refreshData.bind(this);
  }

  componentDidMount() {
    this.refreshData();  // Carregar os dados ao montar o componente
  }

  refreshData() {
    this.setState({ refreshing: true }); // Inicia o refresh
    this.socket = io('http://flask-server-dev.sa-east-1.elasticbeanstalk.com');
    

    this.socket.on('initial_data', (data) => {
      console.log('Dados iniciais recebidos:', data);
      this.setState({
        data: data.dados_estoque_geral,
        dataGeral: data.dados_estoque_geral,
        refreshing: false, // Finaliza o refresh
      });
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
    this.socket.emit('atualizar_estoque_geral', { itensAlterados });
    this.setState({ showEditar: false, itensAlterados: [] });
  };

  searchEstoque = (estoque) => {
    const normalizedEstoque = estoque.toLowerCase();
    if (normalizedEstoque && this.state.dataGeral) {
      const dataFiltrado = this.state.dataGeral.filter((item) =>
        item.item.toLowerCase().startsWith(normalizedEstoque)
      );
      this.setState({ estoque, data: dataFiltrado });
    } else {
      this.setState({ estoque, data: this.state.dataGeral || [] });
    }
  };

  render() {
    const {refreshing} = this.state
    return (
      <View style={styles.container}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>ITEM</Text>
          <TextInput
            style={styles.inputEstoque}
            onChangeText={this.searchEstoque}
            value={this.state.estoque}
          />
          {!this.state.showEditar ? (
            <Button title="Editar" onPress={() => this.setState({ showEditar: true })} />
          ) : (
            <Button title="Confirmar" onPress={this.handleConfirmar} />
          )}
        </View>

        <FlatList
          data={this.state.data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.tableRow}>
              <Text style={styles.itemText}>{item.item}</Text>
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
              ) : (
                <Text style={styles.itemText}>{item.quantidade}</Text>
              )}
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={this.refreshData}  // Chama a função de refresh ao arrastar
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
    backgroundColor: '#f8f9fa',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
  },
  itemText: {
    fontSize: 18,
    fontWeight: '400',
    flex: 2,
    textAlign: 'left',
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
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    flex: 2,
  },
});
