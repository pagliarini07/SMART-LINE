import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { mensagemErroAuth } from "../../utils/errors";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [entrando, setEntrando] = useState(false);
    const { signIn } = useAuth();
    // Vindo do Cadastro: mostra que a conta foi criada.
    const { cadastro } = useLocalSearchParams<{ cadastro?: string }>();

    const handleLogin = async () => {
        if (entrando) {
            return;
        }

        setError("");

        if (!email || !password) {
            setError("Preencha todos os campos.");
            return;
        }

        if (!email.includes("@")) {
            setError("Digite um e-mail válido.");
            return;
        }

        setEntrando(true);

        try {
            await signIn(email.trim().toLowerCase(), password);
            router.replace("/locais");
        } catch (error) {
            setError(mensagemErroAuth(error));
        } finally {
            setEntrando(false);
        }
    };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
      </Pressable>
      <View style={styles.content}>

        <Text style={styles.logo}>
          SmartLine
        </Text>

        <Text style={styles.title}>
          Acesse sua conta
        </Text>

        {cadastro === "ok" ? (
          <Text style={styles.successText}>
            Conta criada com sucesso! Entre com seu e-mail e senha. Se
            recebeu um e-mail de confirmação, confirme antes de entrar.
          </Text>
        ) : null}

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
          editable={!entrando}
        />

        <Text style={styles.label}>
          Senha
        </Text>

        <TextInput
          style={styles.inputSenha}
          placeholder="Digite sua senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          onPress={() => router.push("/forgot-password")}
          accessibilityRole="button"
        >
          <Text style={styles.forgotPasswordText}>
            Esqueci minha senha
          </Text>
        </Pressable>

        {error ? (
            <Text style={styles.errorText}>
                {error}
            </Text>
            ) : null}

        <Pressable
          style={[styles.loginButton, entrando && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={entrando}
          accessibilityRole="button"
        >
          {entrando ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={[styles.loginButtonText, styles.loadingText]}>
                Entrando...
              </Text>
            </View>
          ) : (
            <Text style={styles.loginButtonText}>
              Entrar
            </Text>
          )}
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

    inputSenha: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E0EA",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
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

  loginButtonDisabled: {
    opacity: 0.8,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  loadingText: {
    marginLeft: 8,
  },

  successText: {
    color: "#1B7F45",
    backgroundColor: "#EAF8EF",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 18,
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

  backButton: {
    marginTop: 20,
    marginLeft: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0757D8",
    alignItems: "center",
    justifyContent: "center",
  },

  forgotPasswordText:{
    color: "#0D5BD7",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    marginTop: -8,
    marginBottom: 18,
  },

});