import { useState } from "react";
import {
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleCadastro = () => {
    setError("");

    if (!nome || !email || !password || !confirmPassword) {
        setError("Preencha todos os campos.");
        return;
    }

    if (!email.includes("@")) {
        setError("Digite um e-mail válido.");
        return;
    }

    if (password.length < 8) {
        setError("A senha deve ter pelo menos 8 caracteres.");
        return;
    }

    if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        return;
    }

    console.log("Cadastro válido");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <Text style={styles.logo}>
          SmartLine
        </Text>

        <Text style={styles.title}>
          Crie sua conta
        </Text>

        <Text style={styles.label}>
          Nome
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Digite seu nome"
          value={nome}
          onChangeText={setNome}
        />

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

        <Text style={styles.label}>
          Confirmar senha
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Digite sua senha novamente"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {error ? (
            <Text style={styles.errorText}>
                {error}
            </Text>
            ) : null}

        <Pressable style={styles.registerButton} onPress={handleCadastro}>
          <Text style={styles.registerButtonText}>
            Criar conta
          </Text>
        </Pressable>

        <Pressable>
          <Text style={styles.loginText}>
            Já tenho uma conta
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
    marginBottom: 30,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#12234A",
    marginBottom: 25,
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
    marginBottom: 18,
    fontSize: 16,
  },

  registerButton: {
    height: 50,
    backgroundColor: "#0D5BD7",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 20,
  },

  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  loginText: {
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