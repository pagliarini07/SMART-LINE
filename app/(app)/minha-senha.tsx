import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BottomTabBar from "../../components/BottomTabBar";
import ConfirmacaoInline from "../../components/ConfirmacaoInline";
import { useAuth } from "../../hooks/useAuth";
import {
  contarNaoLidas,
  notificarSeProximo,
} from "../../services/notificacoes";
import {
  atualizarSenhaAtiva,
  cancelarSenha,
  getSenhaAtiva,
  mensagemErroCancelamento,
  SenhaAtiva,
  StatusAtendimento,
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
  orange: "#E67E22",
  orangeSoft: "#FFF3E6",
  orangeBorder: "#F6D6AE",
};

const POLLING_INTERVAL_MS = 10_000;

export default function MinhaSenha() {
  const { user } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [senhaAtiva, setSenhaAtiva] = useState<SenhaAtiva | null>(null);
  const [naoLidas, setNaoLidas] = useState(0);
  const [saindo, setSaindo] = useState(false);
  const [erroSair, setErroSair] = useState("");
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const [saiuDaFila, setSaiuDaFila] = useState(false);
  const [statusFinal, setStatusFinal] =
    useState<StatusAtendimento | null>(null);

  const senhaRef = useRef<SenhaAtiva | null>(null);
  const atualizandoRef = useRef(false);
  const notificacaoTentadaRef = useRef<string | null>(null);

  const tentarNotificar = useCallback(
    async (senha: SenhaAtiva) => {
      if (
        !user ||
        senha.posicao > 2 ||
        notificacaoTentadaRef.current === senha.id
      ) {
        return;
      }

      notificacaoTentadaRef.current = senha.id;

      try {
        await notificarSeProximo(user.id, senha);
        setNaoLidas(await contarNaoLidas(user.id));
      } catch (error) {
        // Permite tentar novamente no próximo ciclo caso tenha sido
        // uma falha real de rede/banco.
        notificacaoTentadaRef.current = null;
        console.error("Erro ao gerar notificação:", error);
      }
    },
    [user]
  );

  useFocusEffect(
    useCallback(() => {
    let ativo = true;
    let intervalo: ReturnType<typeof setInterval> | null = null;

    async function carregarSenha() {
      if (!user) {
        senhaRef.current = null;
        setSenhaAtiva(null);
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErro("");
      setStatusFinal(null);

      try {
        const senha = await getSenhaAtiva(user.id);

        if (!ativo) {
          return;
        }

        senhaRef.current = senha;
        setSenhaAtiva(senha);

        if (senha) {
          setSaiuDaFila(false);
          void tentarNotificar(senha);
        }
      } catch (error) {
        console.error("Erro ao carregar senha ativa:", error);

        if (ativo) {
          setErro("Não foi possível carregar sua senha agora.");
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }

      try {
        const total = await contarNaoLidas(user.id);

        if (ativo) {
          setNaoLidas(total);
        }
      } catch (error) {
        console.error("Erro ao contar notificações:", error);
      }
    }

    async function atualizarFila() {
      const senhaAtual = senhaRef.current;

      if (
        !ativo ||
        !user ||
        !senhaAtual ||
        atualizandoRef.current
      ) {
        return;
      }

      atualizandoRef.current = true;

      try {
        const resultado = await atualizarSenhaAtiva(senhaAtual);

        if (!ativo) {
          return;
        }

        senhaRef.current = resultado.senha;
        setSenhaAtiva(resultado.senha);

        if (resultado.statusFinal) {
          setStatusFinal(resultado.statusFinal);
          setSaiuDaFila(false);
          setConfirmandoSaida(false);
          setErroSair("");
          return;
        }

        if (resultado.senha) {
          void tentarNotificar(resultado.senha);
        }
      } catch (error) {
        // Uma falha temporária no polling não apaga os últimos dados
        // válidos mostrados ao usuário.
        console.error("Erro ao atualizar posição da fila:", error);
      } finally {
        atualizandoRef.current = false;
      }
    }

    void carregarSenha();

    intervalo = setInterval(() => {
      void atualizarFila();
    }, POLLING_INTERVAL_MS);

    return () => {
      ativo = false;

      if (intervalo) {
        clearInterval(intervalo);
      }
    };
  }, [user, tentarNotificar])
  );

  async function sairDaFila() {
    if (!senhaAtiva || saindo) {
      return;
    }

    setSaindo(true);
    setErroSair("");

    try {
      await cancelarSenha(senhaAtiva.id);
      senhaRef.current = null;
      setSenhaAtiva(null);
      setStatusFinal(null);
      setSaiuDaFila(true);
      setConfirmandoSaida(false);
    } catch (error) {
      console.error("Erro ao sair da fila:", error);
      setErroSair(mensagemErroCancelamento(error));
    } finally {
      setSaindo(false);
    }
  }

  const senhaChamada = senhaAtiva?.status === "chamado";

  const tituloSemSenha =
    statusFinal === "atendido"
      ? "Atendimento finalizado"
      : statusFinal === "cancelado"
        ? "Senha cancelada"
        : statusFinal === "nao_compareceu"
          ? "Atendimento encerrado"
          : saiuDaFila
            ? "Você saiu da fila"
            : "Nenhuma senha retirada";

  const descricaoSemSenha =
    statusFinal === "atendido"
      ? "Seu atendimento foi concluído e já aparece no Histórico."
      : statusFinal === "cancelado"
        ? "Sua senha foi cancelada e já aparece no Histórico."
        : statusFinal === "nao_compareceu"
          ? "Sua senha foi encerrada por não comparecimento e já aparece no Histórico."
          : saiuDaFila
            ? "Sua senha foi cancelada e já aparece no seu Histórico."
            : "Escolha um serviço para retirar sua senha digital e acompanhar a fila em tempo real.";

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Minha senha</Text>

        <Pressable
          style={styles.bellButton}
          onPress={() => router.push("/notificacoes" as never)}
        >
          <Ionicons name="notifications-outline" size={20} color={COLORS.blue} />
          {naoLidas > 0 ? (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {naoLidas > 9 ? "9+" : naoLidas}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.content}>
        {carregando ? (
          <ActivityIndicator
            style={styles.loading}
            color={COLORS.blue}
          />
        ) : senhaAtiva ? (
          <>
            <View style={styles.senhaCard}>
              <Text style={styles.senhaCodigo}>{senhaAtiva.codigo}</Text>
              <Text style={styles.senhaServico}>
                {senhaAtiva.servico}
                {senhaAtiva.local ? ` • ${senhaAtiva.local}` : ""}
              </Text>

              <View
                style={[
                  styles.positionCircle,
                  senhaChamada && styles.positionCircleCalled,
                ]}
              >
                <Text
                  style={[
                    styles.positionNumber,
                    senhaChamada && styles.positionNumberCalled,
                  ]}
                >
                  {senhaChamada ? "CHAMADO" : `${senhaAtiva.posicao}º`}
                </Text>

                <Text style={styles.positionLabel}>
                  {senhaChamada ? "dirija-se ao atendimento" : "na fila"}
                </Text>
              </View>

              <Text style={styles.estimate}>
                {senhaChamada
                  ? "Sua senha foi chamada. Dirija-se ao atendimento agora."
                  : `Tempo estimado: ~${senhaAtiva.tempoEstimadoMinutos} minutos`}
              </Text>
            </View>

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

            <View style={styles.warningCard}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={COLORS.orange}
              />
              <Text style={styles.warningText}>
                Não comparecer quando sua senha for chamada zera sua
                sequência de atendimentos.
              </Text>
            </View>

            {erroSair ? (
              <Text style={styles.leaveError}>{erroSair}</Text>
            ) : null}

            {confirmandoSaida ? (
              <View style={styles.confirmacao}>
                <ConfirmacaoInline
                  mensagem="Tem certeza? Você vai perder seu lugar na fila e precisará retirar uma nova senha."
                  textoCancelar="Continuar na fila"
                  textoConfirmar="Sim, sair"
                  onCancelar={() => setConfirmandoSaida(false)}
                  onConfirmar={sairDaFila}
                  carregando={saindo}
                />
              </View>
            ) : (
              <Pressable
                style={styles.leaveButton}
                onPress={() => {
                  setErroSair("");
                  setConfirmandoSaida(true);
                }}
              >
                <Text style={styles.leaveButtonText}>Sair da fila</Text>
              </Pressable>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="ticket-outline"
                size={40}
                color={COLORS.blue}
              />
            </View>

            <Text style={styles.emptyTitle}>{tituloSemSenha}</Text>
            <Text style={styles.emptyDescription}>
              {erro || descricaoSemSenha}
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push("/locais")}
            >
              <Text style={styles.emptyButtonText}>Ver locais</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* BARRA INFERIOR */}
      <BottomTabBar />
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

  bellButton: {
    marginLeft: "auto",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
  },

  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 3,
    backgroundColor: "#D32F2F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },

  bellBadgeText: {
    color: COLORS.white,
    fontSize: 9.5,
    fontWeight: "700",
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 14,
  },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 10,
  },

  loading: {
    marginTop: 60,
  },

  senhaCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,

    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  senhaCodigo: {
    color: COLORS.blue,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 2,
  },

  senhaServico: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },

  positionCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.lightBlue,
    borderWidth: 2,
    borderColor: COLORS.borderBlue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  positionNumber: {
    color: COLORS.blue,
    fontSize: 34,
    fontWeight: "800",
  },

  positionCircleCalled: {
    backgroundColor: "#EAF8EF",
    borderColor: "#B9E3C9",
  },

  positionNumberCalled: {
    color: "#129B56",
    fontSize: 21,
    letterSpacing: 1,
  },

  positionLabel: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  estimate: {
    color: COLORS.text,
    fontSize: 14.5,
    fontWeight: "600",
    marginTop: 16,
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    padding: 14,
    marginTop: 20,
    width: "100%",
  },

  infoText: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: 12.5,
    marginLeft: 10,
  },

  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.orangeSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.orangeBorder,
    padding: 14,
    marginTop: 12,
    width: "100%",
  },

  warningText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12.5,
    marginLeft: 10,
    lineHeight: 17,
  },

  leaveButton: {
    marginTop: 20,
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

  confirmacao: {
    width: "100%",
    marginTop: 20,
  },

  leaveError: {
    color: "#D32F2F",
    fontSize: 12.5,
    textAlign: "center",
    marginTop: 16,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },

  emptyDescription: {
    color: COLORS.secondary,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },

  emptyButton: {
    height: 48,
    paddingHorizontal: 28,
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },

});
