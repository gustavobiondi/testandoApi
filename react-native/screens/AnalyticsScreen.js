import React from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { UserContext } from "../UserContext";

export default class Analytics extends React.Component {
  static contextType = UserContext;

  constructor(props) {
    super(props);
    this.state = {
      faturamento: null,
      dia: null,
      username: "",
      cargo: "",
      showAnalytics: false,
      refreshing: false, // Estado para pull-to-refresh
    };
  }

  componentDidMount() {
    this.initializeData();
  }

  // Função para inicializar os dados
  initializeData = () => {
    const { user } = this.context;

    this.setState({ username: user.username, cargo: user.cargo });

    if (user.cargo === "ADM") {
      this.setState({ showAnalytics: true });
      this.fetchFaturamento();
    }
  };

  // Função para buscar o faturamento do backend
  fetchFaturamento = () => {
    this.setState({ refreshing: true });

    fetch("http://192.168.1.21:5000/faturamento", {
      method: "GET",
    })
      .then((resp) => resp.json())
      .then((data) => {
        if (data && data.faturamento !== null) {
          this.setState({ faturamento: data.faturamento, dia: data.dia });
        }
        this.setState({ refreshing: false });
      })
      .catch((error) => {
        console.error("Erro ao buscar faturamento:", error);
        this.setState({ refreshing: false });
      });
  };

  render() {
    const { showAnalytics, faturamento, dia, refreshing } = this.state;

    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={this.initializeData}
          />
        }
      >
        <View style={{ padding: 20 }}>
          {showAnalytics ? (
            <Text>
              Faturamento do dia {dia}: {faturamento}
            </Text>
          ) : (
            <Text>Você não tem permissão para acessar essa tela</Text>
          )}
        </View>
      </ScrollView>
    );
  }
}
