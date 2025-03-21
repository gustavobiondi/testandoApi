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
      refreshing: false, // Estado para pull-to-refresh
    };
  }

  componentDidMount() {
    this.initializeData();
  }

  // Função para inicializar os dados
  initializeData = () => {
      this.fetchFaturamento();
    }

  // Função para buscar o faturamento do backend
  fetchFaturamento = () => {

    fetch("https://flask-backend-server-yxom.onrender.com/faturamento", {
      method: "GET",
    })
      .then((resp) => resp.json())
      .then((data) => {
        if (data) {
          this.setState({ faturamento: data.faturamento, dia: data.dia });
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar faturamento:", error);
      });
  };

  render() {
    const { faturamento, dia, refreshing } = this.state;

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
            <Text>
              Faturamento do dia {dia}: {faturamento}
            </Text>

        </View>
      </ScrollView>
    );
  }
}
