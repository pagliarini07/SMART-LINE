import {
    SafeAreaView,
    StyleSheet,
    Text,
} from "react-native";

export default function Cadastro() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Tela de Cadastro
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
  },
});