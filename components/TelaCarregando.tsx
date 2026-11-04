import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

/**
 * Tela mostrada enquanto o app verifica se existe uma sessão salva — antes
 * aparecia uma tela totalmente em branco nesse momento.
 */
export default function TelaCarregando() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SmartLine</Text>
      <ActivityIndicator size="large" color="#0757D8" />
      <Text style={styles.texto}>Carregando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F9FC",
  },

  logo: {
    color: "#0757D8",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
  },

  texto: {
    color: "#65708A",
    fontSize: 14,
    marginTop: 12,
  },
});
