import {
    SafeAreaView,
    StyleSheet,
    Text,
} from "react-native";

export default function Inicio() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Tela 02.1 - Início
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