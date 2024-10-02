import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import io from 'socket.io-client';

export default function Cozinha() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const socket = io('http://192.168.15.16:5000');

    // Receber dados iniciais
    socket.on('initial_data', (dados) => {
      setData(dados.filter(item => item.categoria === 'cozinha'));
    });

    // Receber novos pedidos em tempo real
    socket.on('new_order', (newOrder) => {
      if (newOrder.categoria === 'cozinha') {
        setData((prevData) => [...prevData, newOrder]);
      }
    });

    // Quando a comanda for deletada
    socket.on('comanda_deleted', ({ fcomanda }) => {
      setData((prevData) => prevData.filter(item => item.comanda !== fcomanda));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <View>
      <FlatList
        data={data}
        keyExtractor={(item) => item.comanda}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={styles.itemText}>{item.comanda}</Text>
            <Text style={styles.itemText}>{item.pedido}</Text>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.tableHeader}>
            <Text style={styles.headerText}>Comanda</Text>
            <Text style={styles.headerText}>Pedido</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
