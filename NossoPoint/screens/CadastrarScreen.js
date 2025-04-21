import React from "react";
import { KeyboardAvoidingView,View,Text,TextInput,Button,StyleSheet,TouchableOpacity} from "react-native";
import { API_URL } from "./url";
import { Picker } from "@react-native-picker/picker";
import io from 'socket.io-client';
 

export default class Cadastro extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            username:'',
            senha1:'',
            senha2:'',
            showSenha2:false,
            cargo:'',
        }
    }


    componentDidMount(){
      this.socket = io(`${API_URL}`)
    }

    verificar = () =>{
        const {senha1,senha2,showSenha2,username,cargo} = this.state
        if (username && cargo && senha1){
        if (!showSenha2){
            this.setState({showSenha2:true})
        }
        else if (senha2!==senha1){
            alert('senhas conflitantes')
            this.setState({senha2:''})
          }
        else{
            this.socket.emit('cadastrar',{username,senha:senha1,cargo})

            this.setState({username:'',senha1:'',senha2:'',showSenha2:false,cargo:''})
        } 
      }
      else if (!username){
        alert('É preciso ter um username para cadastrar')
      }
      else if(!cargo){
        alert('É preciso selecionar um cargo para cadastrar')
      }
      else if(!senha1){
        alert('É preciso ter uma senha para cadastrar')
      }
    }

    render() {

      const cargos = ['Colaborador', 'ADM', 'Entregador', 'Cozinha']
      
        return (
          <View style={styles.container}>
            <Text style={styles.title}>Cadastro</Text>
            <KeyboardAvoidingView  behavior='padding'>
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              value={this.state.username}
              onChangeText={(username) => this.setState({ username })}
            />
            <Picker
          selectedValue={this.state.cargo}
          onValueChange={(value) => this.setState({ cargo: value })}
          style={styles.picker}
        >
          {/* “Placeholder” */}
          <Picker.Item label="Selecionar Cargo" value="" />
          {/* Opções */}
          <Picker.Item label="Colaborador" value="Colaborador" />
          <Picker.Item label="ADM" value="ADM" />
          <Picker.Item label="Entregador" value="Entregador" />
          <Picker.Item label="Cozinha" value="Cozinha" />
        </Picker>
            <TextInput
            style={styles.input}
              secureTextEntry={true}
              placeholder="Senha"
              value={this.state.senha1}
              onChangeText={(senha1) => this.setState({ senha1 })}
            />
            {this.state.showSenha2 && (
                <TextInput
                style={styles.input}
                  secureTextEntry={true}
                  placeholder="Confirmar Senha"
                  value={this.state.senha2}
                  onChangeText={(senha2) => this.setState({ senha2 })}
                />
            )}
            <Button
              title="Cadastrar"
              onPress={this.verificar}
            />
            </KeyboardAvoidingView>
          </View>
        );
      }
}

const styles = StyleSheet.create({
    container: {
      flex: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      marginBottom: 20,
    },
    input: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      paddingHorizontal: 50,
      borderRadius: 5,
      marginBottom: 10,
    },
    dropdownOptionSelecionado: {
      backgroundColor: '#2196F3',
      borderRadius: 6,
    },
    dropdownTextoSelecionado: {
      color: 'white',
      fontWeight: 'bold',
    },
    picker: {
      height: 50,
      width: '100%',
    },
  });  