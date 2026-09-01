import { router } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = () => {
        setError("");

        if (!email || !password) {
            setError("Preencha todos os campos.");
            return;
        }

        if (!email.includes("@")) {
            setError("Digite um e-mail válido.");
            return;
        }

        router.replace("/inicio");
        };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <Text style={styles.logo}>
          SmartLine
        </Text>

        <Text style={styles.title}>
          Acesse sua conta
        </Text>

        <Text style={styles.label}>
          E-mail
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Digite seu e-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>
          Senha
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Digite sua senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? (
            <Text style={styles.errorText}>
                {error}
            </Text>
            ) : null}

        <Pressable style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>
            Entrar
          </Text>
        </Pressable>

        <Pressable>
          <Text style={styles.registerText} onPress={() => router.push("/cadastro")}>
            Ainda não tenho conta
          </Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  logo: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0D5BD7",
    textAlign: "center",
    marginBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#12234A",
    marginBottom: 30,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#12234A",
    marginBottom: 8,
  },

  input: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E0EA",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },

  loginButton: {
    height: 50,
    backgroundColor: "#0D5BD7",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  registerText: {
    textAlign: "center",
    color: "#0D5BD7",
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    marginBottom: 12,
  },
});