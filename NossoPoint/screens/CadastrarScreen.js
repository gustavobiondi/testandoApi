import React from "react";
import { KeyboardAvoidingView,View,Text,TextInput,Button,StyleSheet} from "react-native";

export default class Cadastro extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            username:'',
            senha1:'',
            senha2:'',
            showSenha2:false,
        }
    }

    verificar = () =>{
        const {senha1,senha2,showSenha2,username} = this.state
        if (!showSenha2){
            this.setState({showSenha2:true})
        }
        else if (senha2!==senha1){
            alert('senhas conflitantes')
            this.setState({senha2:''})
        }
        else{
            fetch('http://flask-server-dev.sa-east-1.elasticbeanstalk.com/cadastrar',{
                method:'POST',
                headers:{
                    'Content-Type':'application/json'
                },
                body: JSON.stringify({
                    username:username,
                    senha:senha1
                })
            }).then(resp=>resp.json)
            .then(data=>{
                console.log(data)
            })
            this.setState({username:'',senha1:'',senha2:'',showSenha2:false})
        } 
    }

    render() {
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
  });
