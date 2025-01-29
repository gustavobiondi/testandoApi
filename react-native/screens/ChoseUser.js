import React, { useContext } from 'react';
import { FlatList, View, Text, RefreshControl, Button } from 'react-native';
import { UserContext } from '../UserContext'; // Import the UserContext

export default class ChoseUser extends React.Component {
  static contextType = UserContext;

  constructor(props) {
    super(props);
    this.state = {
      data: [], // Lista de dados de usuários// Define se o usuário tem permissão para ver a lista
      refreshing: false, // Estado para o controle de pull-to-refresh
    };
  }

  componentDidMount() {
    const { user } = this.context;
    if (user.cargo === 'ADM') {
      this.setState({ showUsers: true });
    }
    this.fetchUsers();
  }

  // Função para buscar usuários
  fetchUsers = () => {
    const { user } = this.context;
    this.setState({ refreshing: true });
    
    fetch('http://192.168.1.21:5000/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: user.username,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        const usuarios_filtrados = data.users.filter(item => item.cargo !== 'ADM');
        this.setState({ data: usuarios_filtrados, refreshing: false });
      })
      .catch((error) => {
        console.error('Erro:', error);
        this.setState({ refreshing: false });
      });
  };

  Liberar = (id, numero) => {
    fetch('http://192.168.1.21:5000/permitir', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: id,
        numero: numero,
      }),
    })
      .then((resp) => resp.json())
      .then((data) => {
        const usuarios_filtrados = data.users.filter(item => item.cargo !== 'ADM');
        this.setState({ data: usuarios_filtrados });
      })
      .catch((error) => {
        console.error('Erro:', error);
      });
  };

  render() {
    const { data, showUsers, refreshing } = this.state;

    return (
      <View style={{ flex: 1, padding: 20 }}>

          <FlatList
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', padding: 10 }}>
                <Text>{item.username}</Text>
                {item.liberado === '0' ? (
                  <Button
                    title="Liberar"
                    onPress={() => this.Liberar(item.id, '1')}
                  />
                ) : (
                  <Button
                    title="Bloquear"
                    onPress={() => this.Liberar(item.id, '0')}
                  />
                )}
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={this.fetchUsers} // Chama a função de busca ao arrastar para baixo
              />
            }
          />
        
      </View>
    );
  }
}