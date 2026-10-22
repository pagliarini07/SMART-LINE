import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { supabase } from "../../services/supabase";
import { mensagemErroAuth } from "../../utils/errors";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleRecuperarSenha() {
    setErro("");
    setSucesso("");

    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado || !emailNormalizado.includes("@")) {
      setErro("Digite um e-mail válido.");
      return;
    }

    setCarregando(true);

    try {
      const redirectTo =
        Platform.OS === "web"
          ? `${window.location.origin}/reset-password`
          : Linking.createURL("reset-password");

      const { error } = await supabase.auth.resetPasswordForEmail(
        emailNormalizado,
        { redirectTo }
      );

      if (error) {
        throw error;
      }

      setSucesso(
        "Se houver uma conta associada a esse e-mail, você receberá um link para redefinir sua senha. Verifique também a caixa de spam."
      );
    } catch (error) {
      setErro(mensagemErroAuth(error));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.logo}>SmartLine</Text>
        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.description}>
          Informe o e-mail associado à sua conta. Enviaremos um link para você
          criar uma nova senha.
        </Text>

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu e-mail"
          placeholderTextColor="#7A8494"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!carregando}
          accessibilityLabel="E-mail da conta"
        />

        {!!erro && <Text style={styles.errorText}>{erro}</Text>}
        {!!sucesso && <Text style={styles.successText}>{sucesso}</Text>}

        <Pressable
          style={[styles.button, carregando && styles.buttonDisabled]}
          onPress={handleRecuperarSenha}
          disabled={carregando}
          accessibilityRole="button"
        >
          {carregando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Enviar link de recuperação</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.replace("/login")}
          disabled={carregando}
          accessibilityRole="button"
        >
          <Text style={styles.loginText}>Voltar para o Login</Text>
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
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#12234A",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#526078",
    marginBottom: 26,
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
    marginBottom: 16,
    fontSize: 16,
    color: "#12234A",
  },
  button: {
    minHeight: 50,
    backgroundColor: "#0D5BD7",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 22,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
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
    lineHeight: 20,
    marginBottom: 12,
  },
  successText: {
    color: "#207245",
    fontSize: 14,
    lineHeight: 20,
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
});
