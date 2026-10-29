import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  LIMITE_PEDIDO,
  mensagemErroTriagem,
  triarPedido,
} from "../services/triagem";

const COLORS = {
  blue: "#0757D8",
  white: "#FFFFFF",
  text: "#0D1E46",
  secondary: "#65708A",
  lightBlue: "#EDF4FF",
  borderBlue: "#DCE4F1",
  red: "#D32F2F",
  yellowSoft: "#FFF7E5",
  yellowText: "#8A6100",
};

/**
 * Assistente de IA da tela Locais (issue #70): o cidadão descreve o que
 * precisa e a Edge Function "triagem" indica o serviço. Fica num card
 * independente — enquanto a IA responde, o resto da tela (busca,
 * categorias e lista de locais) continua funcionando normalmente.
 */
export default function AssistenteIA() {
  const [pedido, setPedido] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [pergunta, setPergunta] = useState("");

  const pedidoVazio = pedido.trim().length === 0;

  async function perguntar() {
    if (carregando || pedidoVazio) {
      return;
    }

    setCarregando(true);
    setErro("");
    setPergunta("");

    try {
      const resposta = await triarPedido(pedido);

      if (resposta.servico_id) {
        // O card de recomendação (issue #71) mostra o resultado; o pedido
        // continua no campo caso o usuário volte pra refinar.
        router.push({
          pathname: "/recomendacao",
          params: { pedido: pedido.trim(), triagem: JSON.stringify(resposta) },
        } as never);
      } else {
        // A IA não teve certeza: mostra a pergunta dela e deixa o pedido no
        // campo pro usuário complementar.
        setPergunta(resposta.pergunta_esclarecimento ?? "");
      }
    } catch (error) {
      console.error("Erro na triagem com IA:", error);
      // O pedido não é apagado — o usuário pode tentar de novo.
      setErro(mensagemErroTriagem(error));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.icon}>
          <Ionicons name="sparkles-outline" size={18} color={COLORS.blue} />
        </View>
        <Text style={styles.title}>Descreva o que você precisa</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Ex.: preciso tirar a segunda via do meu RG"
        placeholderTextColor={COLORS.secondary}
        value={pedido}
        onChangeText={(texto) => {
          setPedido(texto);
          if (erro) {
            setErro("");
          }
        }}
        maxLength={LIMITE_PEDIDO}
        multiline
        editable={!carregando}
      />

      <View style={styles.metaRow}>
        <View style={styles.privacyRow}>
          <Ionicons
            name="shield-checkmark-outline"
            size={13}
            color={COLORS.secondary}
          />
          <Text style={styles.privacyText}>
            Não digite CPF ou dados pessoais.
          </Text>
        </View>

        <Text style={styles.counter}>
          {pedido.length}/{LIMITE_PEDIDO}
        </Text>
      </View>

      <Pressable
        style={[
          styles.button,
          (carregando || pedidoVazio) && styles.buttonDisabled,
        ]}
        onPress={perguntar}
        disabled={carregando || pedidoVazio}
      >
        <Text style={styles.buttonText}>Perguntar</Text>
      </Pressable>

      {carregando ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.blue} />
          <Text style={styles.loadingText}>
            Procurando o serviço certo...
          </Text>
        </View>
      ) : null}

      {erro ? <Text style={styles.errorText}>{erro}</Text> : null}

      {pergunta ? (
        <View style={styles.questionBox}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={16}
            color={COLORS.yellowText}
          />
          <Text style={styles.questionText}>
            {pergunta} Complete seu pedido acima e pergunte de novo.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    borderRadius: 18,
    padding: 14,

    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 4,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },

  input: {
    minHeight: 64,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 13.5,
    textAlignVertical: "top",
    outlineStyle: "none" as never,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },

  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },

  privacyText: {
    color: COLORS.secondary,
    fontSize: 11,
    marginLeft: 4,
  },

  counter: {
    color: COLORS.secondary,
    fontSize: 11,
    marginLeft: 8,
  },

  button: {
    height: 44,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  loadingText: {
    color: COLORS.blue,
    fontSize: 12.5,
    fontWeight: "600",
    marginLeft: 8,
  },

  errorText: {
    color: COLORS.red,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
  },

  questionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.yellowSoft,
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },

  questionText: {
    flex: 1,
    color: COLORS.yellowText,
    fontSize: 12.5,
    lineHeight: 17,
    marginLeft: 6,
  },
});
