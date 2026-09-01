import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function Login() {
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.title}>Login</Text>

        <Text style={styles.subtitle}>
          Tela de login do SmartLine
        </Text>
      </View>
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
    fontSize: 32,
    fontWeight: "700",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 16,
  },
});