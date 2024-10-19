import React from 'react';
import { View, FlatList, Text, StyleSheet, Button, TextInput } from 'react-native';

import io from 'socket.io-client';

export default class EstoqueScreen extends React.Component{
    constructor(props) {
    super(props);
    this.state = {
        data: [],
        showEditar:false,
        itensAlterados:[],
        quantidadeText:null,
        };
      }

      componentDidMount(){
        this.socket = io('http://192.168.1.36:5000');
    
        this.socket.on('connect', () => {
            console.log('Conectado ao servidor');
        });
    
        this.socket.on('initial_data', (data) => {
            console.log(data)
            console.log('Dados iniciais recebidos:', data);
            this.setState({ data: data.dados_estoque });
        })        
      }

      componentWillUnmount(){
        this.socket.disconnect()
    }
       
      aumentarQuantidade = (index) => {
        const atualizar = [...this.state.data]; // Cria uma cópia do array
        const pedido_na_lista = this.state.itensAlterados.some(item => item.item === atualizar[index].item); // Verifica se o item está na lista alterada
        atualizar[index].quantidade = (parseInt(atualizar[index].quantidade) + 1).toString(); // Incrementa e converte para string
        this.setState({ data: atualizar }); // Atualiza o estado com o novo array
      
        if (!pedido_na_lista) {
          this.setState(prevState => ({
            itensAlterados: [...prevState.itensAlterados, atualizar[index]] // Adiciona o item alterado à lista de itens alterados
          }));
        } else {
          this.setState(prevState => ({
            itensAlterados: prevState.itensAlterados.map(item =>
              item.item === atualizar[index].item ? { ...item, quantidade: atualizar[index].quantidade } : item
            ) // Atualiza a quantidade do item alterado na lista de itens alterados
          }));
        }
      };
      
      diminuirQuantidade = (index) => {
        const atualizar = [...this.state.data]; // Cria uma cópia do array
        const pedido_na_lista = this.state.itensAlterados.some(item => item.item === atualizar[index].item); // Verifica se o item está na lista alterada
        atualizar[index].quantidade = Math.max(0, parseInt(atualizar[index].quantidade) - 1).toString(); // Decrementa e converte para string
        this.setState({ data: atualizar }); // Atualiza o estado com o novo array
      
        if (!pedido_na_lista) {
          this.setState(prevState => ({
            itensAlterados: [...prevState.itensAlterados, atualizar[index]] // Adiciona o item alterado à lista de itens alterados
          }));
        } else {
          this.setState(prevState => ({
            itensAlterados: prevState.itensAlterados.map(item =>
              item.item === atualizar[index].item ? { ...item, quantidade: atualizar[index].quantidade } : item
            ) // Atualiza a quantidade do item alterado na lista de itens alterados
          }));
        }
      };
      
      handleConfirmar = () => {
        const { itensAlterados } = this.state; // Corrigido o acesso ao estado
      
        // Envia os itens alterados para o servidor via Socket.IO
        this.socket.emit('atualizar_estoque', { itensAlterados });
        this.setState({showEditar:false})

      };
      alterarQuantidade = (quantidade, index) => {
          const atualizar = [...this.state.data]; // Cria uma cópia do array
          const pedido_na_lista = this.state.itensAlterados.some(item => item.item === atualizar[index].item); // Verifica se o item está na lista alterada
          
          // Cria uma cópia do array de data com a quantidade alterada
          const newData = atualizar.map((item, ind) => {
              if (ind === index) {
                  return { ...item, quantidade: quantidade }; // Atualiza a quantidade do item
              }
              return item;
          });
      
          // Verifica se o item já está na lista de itensAlterados
          if (!pedido_na_lista) {
              // Se não estiver, adiciona o item à lista de itens alterados
              this.setState(prevState => ({
                  itensAlterados: [...prevState.itensAlterados, { ...newData[index] }]
              }));
          } else {
              // Se já estiver, atualiza a quantidade na lista de itens alterados
              this.setState(prevState => ({
                  itensAlterados: prevState.itensAlterados.map(item =>
                      item.item === newData[index].item ? { ...item, quantidade: newData[index].quantidade } : item
                  )
              }));
          } 
      // Atualiza o estado de data com o novo array
      this.setState({ data: newData });
    }      
    
      

      render() {
        return (
            <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <View style={styles.tableHeader}>
                    <Text style={styles.headerText}>ITEM</Text>
                    {!this.state.showEditar ? (
                        <Button title="Editar" onPress={() => this.setState({ showEditar: true })} />
                    ) : (
                        <Button title="Confirmar" onPress={this.handleConfirmar} />
                    )}
                </View>
                <FlatList
                    
                    data={this.state.data}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => {
                        return (
                            <View style={[styles.tableRow,{flex:1}]}>
                                {this.state.showEditar ? (
                                    <View style={[styles.tableRow,{flex:1}]}>
                                        <Text style={styles.itemText}>{item.item}</Text>
                                        <View style={{flexDirection:'row',padding:0}}>

                                        </View>
                                        <View style={[styles.tableRow,{flex:1}]}>
                                            <Button title="-" onPress={() => this.diminuirQuantidade(index)} />
                                            <TextInput 
                                                value={item.quantidade.toString()} 
                                                onChangeText={(text) => this.alterarQuantidade(text, index)}  // Usa onChangeText para capturar o valor digitado
                                            />

                                            <Button title="+" onPress={() => this.aumentarQuantidade(index)} />
                                        </View>
                                    </View>
                                ) : (
                                    <View style={[styles.tableRow,{flex:1}]}>
                                        <Text style={styles.itemText}>{item.item}</Text>
                                        <Text style={styles.itemText}>{item.quantidade}</Text>
                                        
                                        </View>
                                )}
                            </View>
                        );
                    }}
                />
            </View>
        );
    }}
    
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            padding: 10,
            backgroundColor: '#f8f9fa',
        },
        tableHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 15,
            paddingHorizontal: 20,
            backgroundColor: '#e9ecef',
            borderRadius: 8,
            marginBottom: 10,
            width: '95%',
        },
        headerText: {
            fontSize: 20,
            fontWeight: 'bold',
        },
        tableRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
            width: '95%',
        },
        editRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
        },
        normalRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
        },
        itemText: {
            fontSize: 18,
            fontWeight: '400',
            flex: 2,
            textAlign: 'left',
        },
        quantityContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flex: 1,
        },
        quantityText: {
            fontSize: 18,
            fontWeight: '500',
            marginHorizontal: 10,
        },
    });
    