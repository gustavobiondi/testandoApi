import React from "react";
import { Text,View,ScrollView,StyleSheet} from "react-native";
import { io } from "socket.io-client";
import { API_URL } from "./url";
import { Button } from "react-native-web";

export default class coWorksScreen extends React.Component{
constructor(props){
    super(props)
    this.state={
    dataAlteracoes:[],
    dia:'',
    change:0,
    }
}
componentDidMount(){
 this.socket=io(`${API_URL}`)
 this.socket.emit("getAlteracoes",false)
 this.socket.on("respostaAlteracoes", (dados) =>{
    if (dados){this.setState({dataAlteracoes:dados.alteracoes.reverse(),dia:dados.hoje})}
})
}
mudarDia = (change) =>{
    if (change<=0){
    this.socket.emit("getAlteracoes",{emitir:false,change:change})
    this.setState({change:change})
    }   
}

render(){
    const {change} = this.state
    return(
    <ScrollView>
        <View style={{flexDirection:'row'}}>
        <Button title='<' onPress={()=>this.mudarDia(change-1)}/>
        <Text >Dia {this.state.dia}</Text>
        {change!==0 && (
        <Button title='>' onPress={()=>this.mudarDia(change+1)}/>)}
        </View>
        {!!this.state.dataAlteracoes && this.state.dataAlteracoes.map((item , i)=> (
            <View key={i} style={styles.userCard}>
            <Text style={styles.userInfo}>{item.tabela} as {item.horario}</Text>
            <Text>Na {item.tela} o {item.usuario} {item.tipo} {item.alteracao}</Text>
        </View>
        ))}
    </ScrollView>
    )
}
}
const styles =StyleSheet.create({
    userCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        elevation: 3, // Android sombra
        shadowColor: '#000', // iOS sombra
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      userInfo: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
      },
})