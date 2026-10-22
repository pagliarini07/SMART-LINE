import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
import {
  cancelarSenha,
  mensagemErroCancelamento,
  retirarSenha,
  SenhaAtiva,
} from "../../services/senhas";

const COLORS = {
  blue: "#0757D8",
  yellow: "#FFC400",
  background: "#F7F9FC",
  white: "#FFFFFF",
  text: "#0D1E46",
  secondary: "#65708A",
  lightBlue: "#EDF4FF",
  borderBlue: "#CFE0FF",
};

export default function Fila() {
  const { servicoId } = useLocalSearchParams<{ servicoId?: string }>();
  const { user } = useAuth();

  const [senha, setSenha] = useState<SenhaAtiva | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [saindo, setSaindo] = useState(false);
  const [erroSair, setErroSair] = useState("");

  useEffect(() => {
    let montado = true;

    async function entrarNaFila() {
      if (!user) {
        if (montado) {
          setErro("É necessário estar logado para retirar uma senha.");
          setCarregando(false);
        }
        return;
      }

      if (!servicoId) {
        if (montado) {
          setErro("Serviço não informado.");
          setCarregando(false);
        }
        return;
      }

      try {
        setCarregando(true);
        setErro("");

        const senhaReal = await retirarSenha(user.id, servicoId);

        if (montado) {
          setSenha(senhaReal);
        }
      } catch (error) {
        console.error("Erro ao retirar senha:", error);

        const mensagem =
          error instanceof Error ? error.message : "";

        if (montado) {
          setErro(
            mensagem.includes("senha ativa")
              ? mensagem
              : "Não foi possível entrar na fila agora. Tente novamente."
          );
        }
      } finally {
        if (montado) {
          setCarregando(false);
        }
      }
    }

    entrarNaFila();

    return () => {
      montado = false;
    };
  }, [user, servicoId]);

  async function sairDaFila() {
    if (!senha || saindo) {
      return;
    }

    setSaindo(true);
    setErroSair("");

    try {
      await cancelarSenha(senha.id);
      // Volta pra lista de serviços: a senha cancelada já sai de
      // "Minha senha" e aparece no Histórico.
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/locais");
      }
    } catch (error) {
      console.error("Erro ao sair da fila:", error);
      setErroSair(mensagemErroCancelamento(error));
      setSaindo(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </Pressable>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {senha?.servico ?? "Fila"}
          </Text>

          {senha?.local ? (
            <Text style={styles.headerSubtitle}>{senha.local}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.content}>
        {carregando ? (
          <View style={styles.feedbackContainer}>
            <ActivityIndicator size="large" color={COLORS.blue} />
            <Text style={styles.feedbackText}>
              Retirando sua senha...
            </Text>
          </View>
        ) : erro ? (
          <View style={styles.feedbackContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={42}
              color="#D32F2F"
            />

            <Text style={styles.errorText}>{erro}</Text>

            <Pressable
              style={styles.backToServicesButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backToServicesText}>
                Voltar aos serviços
              </Text>
            </Pressable>
          </View>
        ) : senha ? (
          <>
            <View style={styles.positionCircle}>
              <Text style={styles.positionNumber}>
                {senha.posicao}º
              </Text>
              <Text style={styles.positionLabel}>na fila</Text>
            </View>

            <Text style={styles.estimate}>
              Tempo estimado: ~{senha.tempoEstimadoMinutos} minutos
            </Text>

            <View style={styles.infoCard}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={COLORS.blue}
              />
              <Text style={styles.infoText}>
                Você será avisado quando estiver próximo de ser chamado.
              </Text>
            </View>

            {erroSair ? (
              <Text style={styles.leaveError}>{erroSair}</Text>
            ) : null}

            <Pressable
              style={[styles.leaveButton, saindo && styles.leaveButtonDisabled]}
              onPress={sairDaFila}
              disabled={saindo}
            >
              {saindo ? (
                <ActivityIndicator color="#D32F2F" />
              ) : (
                <Text style={styles.leaveButtonText}>Sair da fila</Text>
              )}
            </Pressable>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
  },

  headerInfo: {
    marginLeft: 14,
    flex: 1,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
  },

  headerSubtitle: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 2,
  },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 30,
  },

  feedbackContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },

  feedbackText: {
    color: COLORS.secondary,
    fontSize: 14,
    marginTop: 14,
  },

  errorText: {
    color: COLORS.text,
    fontSize: 14,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 20,
  },

  backToServicesButton: {
    marginTop: 20,
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },

  backToServicesText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },

  positionCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.lightBlue,
    borderWidth: 2,
    borderColor: COLORS.borderBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  positionNumber: {
    color: COLORS.blue,
    fontSize: 42,
    fontWeight: "800",
  },

  positionLabel: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },

  estimate: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 20,
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    padding: 14,
    marginTop: 30,
  },

  infoText: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: 12.5,
    marginLeft: 10,
  },

  leaveButton: {
    marginTop: 30,
    height: 50,
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E7A3A3",
    alignItems: "center",
    justifyContent: "center",
  },

  leaveButtonText: {
    color: "#D32F2F",
    fontSize: 14,
    fontWeight: "700",
  },

  leaveButtonDisabled: {
    opacity: 0.7,
  },

  leaveError: {
    color: "#D32F2F",
    fontSize: 12.5,
    textAlign: "center",
    marginTop: 20,
  },
});
