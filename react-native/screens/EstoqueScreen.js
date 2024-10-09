import React from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import io from 'socket.io-client';

export default class EstoqueScreen extends React.Component{
    constructor(props) {
    super(props);
    this.state = {
        data: [],
        };
      }

      componentDidMount(){
        this.socket = io('http://127.0.0.1:5000');
    
        this.socket.on('connect', () => {
            console.log('Conectado ao servidor');
        });
    
        this.socket.on('initial_data', (data) => {
            console.log(data)
            console.log('Dados iniciais recebidos:', data);
            this.setState({ data: data.dados_estoque });
        });
    
        this.socket.on('update_estoque', (data) => {
            console.log('Atualização de estoque recebida:', data);
            this.setState({ data: data });
        });
    }
    

    componentWillUnmount(){
        this.socket.disconnect()
    }

    render(){
        return(
        <View style={styles.container}>
            <View style={styles.tableHeader}>
                <Text style={styles.headerText}>ITEM</Text>
                <Text style={styles.headerText}>QUANTIDADE</Text>
            </View>
            <FlatList
                data={this.state.data}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item}) => {
                    return (
                    <View style={styles.tableRow}>
                        <Text style={styles.itemText}>{item.item}</Text>
                        <Text style={styles.itemText}>{item.quantidade}</Text>
                    </View>
                    );
            }}
/>


        </View>
        )
    }}

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