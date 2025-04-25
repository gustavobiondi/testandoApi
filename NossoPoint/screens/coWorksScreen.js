import React from "react";
import { Text,View,ScrollView} from "react-native";
import { io } from "socket.io-client";
import { API_URL } from "./url";

export default class coWorksScreen extends React.Component{
constructor(props){
    super(props)
    this.state={
    dataAlteracoes:[],
    }
}
componentDidMount(){
 this.socket=io(`${API_URL}`)
 this.socket.emit("getAlteracoes",false)
 this.socket.on("respostaAlteracoes", (dados) =>{
    if (dados){this.setState({dataAlteracoes:dados.alteracoes})}
})
}
render(){
    return(
    <ScrollView>
        <Text>Dia</Text>
        {!!this.state.dataAlteracoes && this.state.dataAlteracoes.map((item , i)=> (
            <View key={i}>
            <Text>{item.tabela} as {item.horario}</Text>
            <Text>Na {item.tela} o {item.usuario} {item.tipo} {item.alteracao}</Text>
        </View>
        
        ))}
    </ScrollView>
    )
}
}