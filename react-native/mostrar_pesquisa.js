import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Text } from 'react-native';

export default function Pesquisa({ pedido_filtrado, setPedidoFiltrado }) {
  // Função para remover todos os itens da lista ao clicar
  const handleItemPress = (itemToRemove) => {
    // Filtrar o item clicado da lista
    setPedidoFiltrado([]);  // Atualiza o estado corretamente
  };

  return (
    <View>
      <FlatList
        data={pedido_filtrado}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => handleItemPress(item)} // Remover apenas o item clicado
          >
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}


