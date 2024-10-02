import { FlatList, View, Text, StyleSheet } from 'react-native';
import React, { useRef, useEffect } from 'react';

const Comandas = ({ data, fcomanda, preco }) => {
  const flatListRef = useRef();

  // Filtrar os dados para a comanda selecionada
  const filteredData = data.filter(item => item.comanda === fcomanda);

  useEffect(() => {
    // Rolagem automática para o fim da lista quando novos dados chegarem
    if (flatListRef.current && filteredData.length > 0) {
      flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
    }
  }, [filteredData]);

  return (
    <View style={styles.container}>
      {/* Cabeçalho fixo no topo */}
      <View style={styles.tableHeader}>
        <Text style={styles.headerText}>Comanda</Text>
        <Text style={styles.headerText}>Pedido</Text>
      </View>

      {/* FlatList invertida para mostrar as mensagens mais recentes na parte inferior */}
      <FlatList
        ref={flatListRef}
        data={filteredData}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={styles.itemText}>{item.comanda}</Text>
            <Text style={styles.itemText}>{item.pedido}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        inverted // Inverte a lista para que as mensagens mais recentes apareçam na parte inferior
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
      />
      <View style={styles.container}>
        <Text>PRECO</Text>
        <Text>{preco}</Text>
      </View>
    </View>
  
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
    backgroundColor: '#f7f7f7', // Garante que o cabeçalho se destaque
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
});

export default Comandas;
