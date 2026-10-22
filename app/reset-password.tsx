import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
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

import { supabase } from "../services/supabase";
import { mensagemErroAuth } from "../utils/errors";

export default function ResetPassword() {
  const params = useLocalSearchParams<{
    code?: string;
    access_token?: string;
    refresh_token?: string;
    type?: string;
  }>();

  const codigoProcessado = useRef<string | null>(null);

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [preparando, setPreparando] = useState(true);
  const [sessaoValida, setSessaoValida] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function prepararRecuperacao() {
      const hashParams =
        Platform.OS === "web"
          ? new URLSearchParams(window.location.hash.slice(1))
          : new URLSearchParams();

      const codeFromUrl = hashParams.get("code");
      const accessTokenFromUrl = hashParams.get("access_token");
      const refreshTokenFromUrl = hashParams.get("refresh_token");
      const typeFromUrl = hashParams.get("type");

      const codeParam = Array.isArray(params.code)
        ? params.code[0]
        : params.code;

      const accessTokenParam = Array.isArray(params.access_token)
        ? params.access_token[0]
        : params.access_token;

      const refreshTokenParam = Array.isArray(params.refresh_token)
        ? params.refresh_token[0]
        : params.refresh_token;

      const typeParam = Array.isArray(params.type)
        ? params.type[0]
        : params.type;

      const code = codeFromUrl || codeParam;
      const accessToken = accessTokenFromUrl || accessTokenParam;
      const refreshToken = refreshTokenFromUrl || refreshTokenParam;
      const type = typeFromUrl || typeParam;

      try {
        if (type && type !== "recovery") {
          throw new Error("Este link não é de recuperação de senha.");
        }

        if (accessToken && refreshToken) {
          const chave = `${accessToken}:${refreshToken}`;

          if (codigoProcessado.current === chave) {
            return;
          }

          codigoProcessado.current = chave;

          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }
        } else if (code) {
          if (codigoProcessado.current === code) {
            return;
          }

          codigoProcessado.current = code;

          const { error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        } else {
          const { data, error } = await supabase.auth.getSession();

          if (error || !data.session) {
            throw new Error(
              "O link é inválido ou expirou. Solicite um novo link."
            );
          }
        }

        if (ativo) {
          setSessaoValida(true);
          setErro("");
        }
      } catch (error) {
        if (ativo) {
          setSessaoValida(false);
          setErro(mensagemErroAuth(error));
        }
      } finally {
        if (ativo) {
          setPreparando(false);
        }
      }
    }

    prepararRecuperacao();

    return () => {
      ativo = false;
    };
  }, [
    params.code,
    params.access_token,
    params.refresh_token,
    params.type,
  ]);

  async function handleAlterarSenha() {
    setErro("");
    setSucesso("");

    if (novaSenha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (novaSenha !== confirmacao) {
      setErro("As senhas não coincidem.");
      return;
    }

    setSalvando(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) {
        throw error;
      }

      setSucesso(
        "Senha alterada com sucesso. Você já pode entrar na sua conta."
      );

      setNovaSenha("");
      setConfirmacao("");

      await supabase.auth.signOut();
    } catch (error) {
      setErro(mensagemErroAuth(error));
    } finally {
      setSalvando(false);
    }
  }

  if (preparando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#0D5BD7" />
          <Text style={styles.description}>
            Validando o link de recuperação...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>SmartLine</Text>
        <Text style={styles.title}>Criar nova senha</Text>
        <Text style={styles.description}>
          Escolha uma nova senha para acessar sua conta.
        </Text>

        {sessaoValida && !sucesso ? (
          <>
            <Text style={styles.label}>Nova senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite a nova senha"
              placeholderTextColor="#7A8494"
              secureTextEntry
              autoCapitalize="none"
              value={novaSenha}
              onChangeText={setNovaSenha}
              editable={!salvando}
            />

            <Text style={styles.label}>Confirmar nova senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite novamente a nova senha"
              placeholderTextColor="#7A8494"
              secureTextEntry
              autoCapitalize="none"
              value={confirmacao}
              onChangeText={setConfirmacao}
              editable={!salvando}
            />

            {!!erro && <Text style={styles.errorText}>{erro}</Text>}

            <Pressable
              style={[styles.button, salvando && styles.buttonDisabled]}
              onPress={handleAlterarSenha}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Salvar nova senha</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            {!!erro && <Text style={styles.errorText}>{erro}</Text>}
            {!!sucesso && <Text style={styles.successText}>{sucesso}</Text>}

            <Pressable
              style={styles.button}
              onPress={() =>
                router.replace(sucesso ? "/login" : "/forgot-password")
              }
            >
              <Text style={styles.buttonText}>
                {sucesso ? "Ir para o Login" : "Solicitar novo link"}
              </Text>
            </Pressable>
          </>
        )}
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
    marginBottom: 18,
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
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
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
    marginTop: 16,
  },
});
