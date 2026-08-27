import { View, Text, TextInput, StyleSheet } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SmartLine</Text>

      <Text style={styles.title}>Olá, Lucas!</Text>

      <Text style={styles.subtitle}>
        Encontre o serviço que precisa e acompanhe sua fila.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Buscar órgão ou serviço"
        placeholderTextColor="#7A7A7A"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 24,
  },

  logo: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#0757D8",
    marginTop: 40,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0D1E46",
    marginTop: 40,
  },

  subtitle: {
    fontSize: 16,
    color: "#4A5568",
    marginTop: 8,
    lineHeight: 22,
  },

  input: {
    marginTop: 24,
    backgroundColor: "#F2F4F7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0D1E46",
  },
});
