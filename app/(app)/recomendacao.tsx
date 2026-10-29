import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  LIMIAR_CONFIANCA,
  montarRecomendacaoDaTriagem,
  Recomendacao,
} from "../../services/recomendacao";
import {
  LIMITE_PEDIDO,
  mensagemErroTriagem,
  TriagemResposta,
  triarPedido,
  validarRespostaTriagem,
} from "../../services/triagem";

const COLORS = {
  blue: "#0757D8",
  background: "#F7F9FC",
  white: "#FFFFFF",
  text: "#0D1E46",
  secondary: "#65708A",
  lightBlue: "#EDF4FF",
  borderBlue: "#CFE0FF",
  yellow: "#FFC400",
};

type Estado =
  | { tipo: "inicial" }
  | { tipo: "sem-resultado" }
  | { tipo: "esclarecimento"; pergunta: string }
  | { tipo: "recomendacao"; recomendacao: Recomendacao; mostrarAlternativas: boolean };

export default function RecomendacaoInteligente() {
  // Vindo do Assistente de IA da tela Locais: o pedido e a resposta da
  // triagem já chegam prontos, sem precisar perguntar de novo.
  const params = useLocalSearchParams<{ pedido?: string; triagem?: string }>();

  const [pedido, setPedido] = useState(params.pedido ?? "");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");
  const [estado, setEstado] = useState<Estado>({ tipo: "inicial" });

  async function mostrarResposta(resposta: TriagemResposta) {
    if (!resposta.servico_id) {
      setEstado({
        tipo: "esclarecimento",
        pergunta: resposta.pergunta_esclarecimento ?? "",
      });
      return;
    }

    const resultado = await montarRecomendacaoDaTriagem(resposta);

    setEstado(
      resultado
        ? { tipo: "recomendacao", recomendacao: resultado, mostrarAlternativas: false }
        : { tipo: "sem-resultado" }
    );
  }

  useEffect(() => {
    if (!params.triagem) {
      return;
    }

    async function carregarRespostaRecebida(triagemJson: string) {
      setBuscando(true);

      try {
        await mostrarResposta(validarRespostaTriagem(JSON.parse(triagemJson)));
      } catch (error) {
        console.error("Erro ao montar recomendação:", error);
        setErro(mensagemErroTriagem(error));
      } finally {
        setBuscando(false);
      }
    }

    carregarRespostaRecebida(params.triagem);
  }, [params.triagem]);

  const handleBuscar = async () => {
    if (!pedido.trim()) {
      setErro("Descreva o que você precisa fazer.");
      return;
    }

    setErro("");
    setBuscando(true);

    try {
      await mostrarResposta(await triarPedido(pedido));
    } catch (error) {
      console.error("Erro ao buscar recomendação:", error);
      setErro(mensagemErroTriagem(error));
    } finally {
      setBuscando(false);
    }
  };

  const handleRetirarSenha = (servicoId: string) => {
    // A IA (ou, aqui, o recomendador) nunca retira a senha sozinha — só
    // leva pro fluxo real (Fila -> retirarSenha) depois que o usuário
    // confirma tocando no botão.
    router.push({
      pathname: "/fila",
      params: { servicoId },
    } as never);
  };

  const mostrarAlternativas = () => {
    if (estado.tipo === "recomendacao") {
      setEstado({ ...estado, mostrarAlternativas: true });
    }
  };

  const confiancaBoa =
    estado.tipo === "recomendacao" &&
    estado.recomendacao.confianca >= LIMIAR_CONFIANCA &&
    !estado.mostrarAlternativas;

  const precisaEsclarecer =
    estado.tipo === "recomendacao" &&
    (estado.recomendacao.confianca < LIMIAR_CONFIANCA ||
      estado.mostrarAlternativas);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>O que você precisa?</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Descreva o que você precisa fazer</Text>

        <TextInput
          style={styles.input}
          placeholder="Ex: preciso tirar a segunda via do meu RG"
          placeholderTextColor={COLORS.secondary}
          value={pedido}
          onChangeText={setPedido}
          multiline
          maxLength={LIMITE_PEDIDO}
        />

        {erro ? <Text style={styles.errorText}>{erro}</Text> : null}

        <Pressable
          style={[styles.searchButton, buscando && styles.searchButtonDisabled]}
          onPress={handleBuscar}
          disabled={buscando}
        >
          {buscando ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.searchButtonText}>Buscar recomendação</Text>
          )}
        </Pressable>

        {estado.tipo === "esclarecimento" ? (
          <View style={styles.infoCard}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color={COLORS.blue}
            />
            <Text style={styles.infoText}>
              {estado.pergunta ||
                "Pode descrever com mais detalhes o que você precisa?"}{" "}
              Complete seu pedido acima e busque de novo.
            </Text>
          </View>
        ) : null}

        {estado.tipo === "sem-resultado" ? (
          <View style={styles.infoCard}>
            <Ionicons name="help-circle-outline" size={20} color={COLORS.blue} />
            <Text style={styles.infoText}>
              Não encontramos nenhum serviço relacionado ao que você
              descreveu. Tente descrever de outro jeito, ou procure
              diretamente na lista de locais.
            </Text>
          </View>
        ) : null}

        {confiancaBoa && estado.tipo === "recomendacao" ? (
          <View style={styles.recCard}>
            <Text style={styles.recTitulo}>{estado.recomendacao.titulo}</Text>
            <Text style={styles.recLocal}>{estado.recomendacao.nomeLocal}</Text>

            <View style={styles.waitingRow}>
              <Ionicons name="people" size={14} color={COLORS.blue} />
              <Text style={styles.waitingText}>
                {estado.recomendacao.pessoasAguardando} pessoas aguardando
              </Text>
            </View>

            <View style={styles.motivoBox}>
              <Text style={styles.motivoLabel}>Recomendado porque</Text>
              <Text style={styles.motivoTexto}>{estado.recomendacao.motivo}</Text>
            </View>

            <View style={styles.documentosBox}>
              <Text style={styles.documentosLabel}>
                Leve com você (sugestão — confirme no local):
              </Text>

              {estado.recomendacao.documentosSugeridos.map((documento) => (
                <View key={documento} style={styles.documentoRow}>
                  <Ionicons
                    name="document-text-outline"
                    size={14}
                    color={COLORS.secondary}
                  />
                  <Text style={styles.documentoTexto}>{documento}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={styles.confirmButton}
              onPress={() => handleRetirarSenha(estado.recomendacao.servicoId)}
            >
              <Text style={styles.confirmButtonText}>Retirar senha</Text>
            </Pressable>

            <Pressable style={styles.naoEIssoButton} onPress={mostrarAlternativas}>
              <Text style={styles.naoEIssoText}>Não é isso?</Text>
            </Pressable>
          </View>
        ) : null}

        {precisaEsclarecer && estado.tipo === "recomendacao" ? (
          <View style={styles.esclarecimentoCard}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color={COLORS.blue}
            />

            <Text style={styles.esclarecimentoTitulo}>
              {estado.recomendacao.confianca < LIMIAR_CONFIANCA
                ? "Não tenho certeza — qual dessas opções é a sua?"
                : "Essas outras opções também podem ser o que você precisa:"}
            </Text>

            {[
              {
                servicoId: estado.recomendacao.servicoId,
                titulo: estado.recomendacao.titulo,
                nomeLocal: estado.recomendacao.nomeLocal,
              },
              ...estado.recomendacao.alternativas,
            ].map((opcao) => (
              <View key={opcao.servicoId} style={styles.opcaoCard}>
                <View style={styles.opcaoInfo}>
                  <Text style={styles.opcaoTitulo}>{opcao.titulo}</Text>
                  <Text style={styles.opcaoLocal}>{opcao.nomeLocal}</Text>
                </View>

                <Pressable
                  style={styles.opcaoButton}
                  onPress={() => handleRetirarSenha(opcao.servicoId)}
                >
                  <Text style={styles.opcaoButtonText}>Retirar senha</Text>
                </Pressable>
              </View>
            ))}

            <Pressable
              style={styles.verLocaisButton}
              onPress={() => router.push("/locais")}
            >
              <Text style={styles.verLocaisText}>
                Nenhuma dessas — ver todos os locais
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
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

  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 14,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  input: {
    minHeight: 80,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#D9E0EA",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    textAlignVertical: "top",
  },

  errorText: {
    color: "#D32F2F",
    fontSize: 12.5,
    marginTop: 8,
  },

  searchButton: {
    height: 50,
    backgroundColor: COLORS.blue,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },

  searchButtonDisabled: {
    opacity: 0.7,
  },

  searchButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    padding: 14,
    marginTop: 20,
  },

  infoText: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: 13,
    marginLeft: 10,
    lineHeight: 18,
  },

  recCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    padding: 18,
    marginTop: 20,

    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  recTitulo: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "800",
  },

  recLocal: {
    color: COLORS.secondary,
    fontSize: 13,
    marginTop: 2,
  },

  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  waitingText: {
    color: COLORS.secondary,
    fontSize: 12.5,
    marginLeft: 6,
  },

  motivoBox: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },

  motivoLabel: {
    color: COLORS.blue,
    fontSize: 11.5,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  motivoTexto: {
    color: COLORS.text,
    fontSize: 13.5,
    marginTop: 4,
    lineHeight: 18,
  },

  documentosBox: {
    marginTop: 16,
  },

  documentosLabel: {
    color: COLORS.text,
    fontSize: 12.5,
    fontWeight: "700",
    marginBottom: 6,
  },

  documentoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  documentoTexto: {
    color: COLORS.secondary,
    fontSize: 12.5,
    marginLeft: 8,
  },

  confirmButton: {
    height: 50,
    backgroundColor: COLORS.blue,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  confirmButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },

  naoEIssoButton: {
    alignItems: "center",
    marginTop: 12,
  },

  naoEIssoText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  esclarecimentoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    padding: 18,
    marginTop: 20,
  },

  esclarecimentoTitulo: {
    color: COLORS.text,
    fontSize: 14.5,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 14,
  },

  opcaoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  opcaoInfo: {
    flex: 1,
    marginRight: 10,
  },

  opcaoTitulo: {
    color: COLORS.text,
    fontSize: 13.5,
    fontWeight: "700",
  },

  opcaoLocal: {
    color: COLORS.secondary,
    fontSize: 11.5,
    marginTop: 2,
  },

  opcaoButton: {
    borderWidth: 1,
    borderColor: COLORS.blue,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  opcaoButtonText: {
    color: COLORS.blue,
    fontSize: 11.5,
    fontWeight: "700",
  },

  verLocaisButton: {
    alignItems: "center",
    marginTop: 6,
  },

  verLocaisText: {
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: "600",
  },
});
