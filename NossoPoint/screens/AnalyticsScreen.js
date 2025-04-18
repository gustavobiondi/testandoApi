import React from "react";
import { View, Text, ScrollView, RefreshControl, StyleSheet,Image } from "react-native";
import { UserContext } from "../UserContext";
import { API_URL } from "./url";
import Icon from 'react-native-vector-icons/FontAwesome';
import { TouchableOpacity } from 'react-native';
import io from 'socket.io-client';

export default class Analytics extends React.Component {
  static contextType = UserContext;

  constructor(props) {
    super(props);
    this.state = {
      faturamento: "",
      dia: "",
      username: "",
      cargo: "",
      refreshing: false, // Estado para pull-to-refresh
      faturamento_previsto:'',
      drink:"",
      porcao:"",
      pedidos:"",
      restante:"",
      imagemBase64:null,
      caixinha:"",
    };
    };

  componentDidMount() {
    this.socket = io(`${API_URL}`);

    this.socket.on('faturamento_enviar', (data)=>{
      if (data) {
        this.setState({ faturamento: data.faturamento, dia: data.dia,faturamento_previsto:data.faturamento_previsto,drink:data.drink,porcao:data.porcao, restante:data.restante,pedidos:data.pedidos,imagemBase64:data.grafico,caixinha:data.caixinha})
        console.log("tamanho", data.grafico.length);
        console.log("caixinha", data.caixinha)
      }}
    )

    this.initializeData()
    
  }
  initializeData = ()=> {
    this.socket.emit('faturamento')
  }
  

  // Função para buscar o faturamento do backend
  
  render() {
    const { faturamento, dia, refreshing,faturamento_previsto,drink,porcao,pedidos,restante,caixinha } = this.state;
  
    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1}}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={this.initializeData}
          />
        }
      >
        <View style={styles.container}>
          <View style={styles.dateBox}>
            <TouchableOpacity onPress={this.abrirCalendario} style={styles.dateButton}>
            <Icon name="calendar" size={18} color="#333" style={styles.dateIcon} />
              <Text style={styles.dateText}>Dia {dia}</Text>
            </TouchableOpacity>
            <Text style={styles.valorText}>Faturamento = R$ {faturamento}</Text>
            <Text style={styles.valorText}>Faturamento Previsto = R$ {faturamento_previsto}</Text>
            <Text style={styles.valorText}>Pedidos Totais = {pedidos}</Text>
            <Text style={styles.valorText}>Caixinha 10% = R$ {caixinha}</Text>
            <Text style={styles.valorText}>Total de Drinks = {drink}</Text>
            <Text style={styles.valorText}>Total de porcoes = {porcao}</Text>
            <Text style={styles.valorText}>Pedidos Restantes = {restante}</Text>
            
            


          </View>
        </View>
        <View style={styles.container}>
          <View style={styles.dateBox}>
          {this.state.imagemBase64 && (
          <View style={{paddingEnd:20}}>
            <Text style={{fontSize:20}}>Grafico Porcentagem Faturamento</Text>
          <Image
            source={{uri:`${API_URL}/static/grafico.png?${new Date().getTime()}`}} 
            style={{ width: 350, height: 350,paddingEnd:20}}
            resizeMode="contain"
          />
        </View>
        )}
            
          </View>

        </View>


      </ScrollView>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    paddingHorizontal:15,
    paddingTop:20,
    flexDirection:"column",
  },
  dateBox: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  valorText: {
    fontSize: 16,
    color: '#333',
  }
})