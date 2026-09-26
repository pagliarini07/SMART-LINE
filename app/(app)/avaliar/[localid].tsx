import { Ionicons } from "@expo/vector-icons";
import {
    router,
    Stack,
    useLocalSearchParams,
} from "expo-router";
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

import {
    buscarMinhaAvaliacao,
    criarAvaliacao,
    editarAvaliacao,
} from "../../../lib/avaliacoes";

const COLORS = {
  blue: "#0757D8",
  yellow: "#FFC400",
  background: "#F7F9FC",
  white: "#FFFFFF",
  text: "#0D1E46",
  secondary: "#65708A",
  borderBlue: "#DCE4F1",
  yellowSoft: "#FFF7E5",
  red: "#D93025",
};

const LOCAIS = {
  "22222222-2222-2222-2222-222222222001": {
    nome: "Resolve Palmas — Centro",
    endereco: "Av. JK, 104 Norte, Palmas – TO",
  },

  "22222222-2222-2222-2222-222222222002": {
    nome: "Cartório 2º Ofício",
    endereco: "Quadra 104 Norte, Av. LO 2, Nº 30",
  },

  "22222222-2222-2222-2222-222222222003": {
    nome: "Detran Palmas",
    endereco: "104 Sul, Av. LO 1, Conj. 01, Lt. 05",
  },
} as const;

export default function AvaliarLocal() {
  const { localid } = useLocalSearchParams<{
    localid: string;
  }>();

  const [nota, setNota] = useState(0);
  const [avaliacaoId, setAvaliacaoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const localId = Array.isArray(localid)
    ? localid[0]
    : localid;

  const local = localId
    ? LOCAIS[localId as keyof typeof LOCAIS]
    : undefined;

  useEffect(() => {
    async function carregarAvaliacao() {
      if (!localId) {
        setErro("Local não encontrado.");
        setCarregando(false);
        return;
      }

      try {
        const avaliacao = await buscarMinhaAvaliacao(localId);

        if (avaliacao) {
          setNota(avaliacao.nota);
          setAvaliacaoId(avaliacao.id);
        }
      } catch (error) {
        console.error("Erro ao carregar avaliação:", error);
        setErro("Não foi possível carregar sua avaliação.");
      } finally {
        setCarregando(false);
      }
    }

    carregarAvaliacao();
  }, [localId]);

  async function salvarAvaliacao() {
    if (!localId || nota === 0) {
      setErro("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    try {
      setErro("");
      setSalvando(true);

      if (avaliacaoId) {
        await editarAvaliacao(avaliacaoId, nota);
      } else {
        await criarAvaliacao(localId, nota);
      }

      router.back();
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
      setErro("Não foi possível salvar sua avaliação.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" />

        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color={COLORS.blue}
          />

          <Text style={styles.loadingText}>
            Carregando sua avaliação...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!local) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={50}
            color={COLORS.red}
          />

          <Text style={styles.errorTitle}>
            Local não encontrado
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>
              Voltar
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          style={styles.backIcon}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={COLORS.white}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Avaliar local
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.localIcon}>
          <Ionicons
            name="business-outline"
            size={38}
            color={COLORS.blue}
          />
        </View>

        <Text style={styles.localName}>
          {local.nome}
        </Text>

        <Text style={styles.localAddress}>
          {local.endereco}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.question}>
          Como você avalia este local?
        </Text>

        <Text style={styles.description}>
          Sua avaliação ajuda outros usuários a
          conhecerem melhor o local.
        </Text>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((estrela) => (
            <Pressable
              key={estrela}
              onPress={() => setNota(estrela)}
              style={styles.starButton}
            >
              <Ionicons
                name={
                  estrela <= nota
                    ? "star"
                    : "star-outline"
                }
                size={48}
                color={COLORS.yellow}
              />
            </Pressable>
          ))}
        </View>

        <Text style={styles.note}>
          {nota === 0
            ? "Selecione uma nota"
            : `${nota} ${
                nota === 1 ? "estrela" : "estrelas"
              }`}
        </Text>

        {avaliacaoId && (
          <View style={styles.editInfo}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={COLORS.blue}
            />

            <Text style={styles.editInfoText}>
              Você já avaliou este local. Ao salvar,
              sua avaliação será atualizada.
            </Text>
          </View>
        )}

        {erro !== "" && (
          <Text style={styles.errorText}>
            {erro}
          </Text>
        )}

        <Pressable
          style={[
            styles.saveButton,
            (salvando || nota === 0) &&
              styles.saveButtonDisabled,
          ]}
          onPress={salvarAvaliacao}
          disabled={salvando || nota === 0}
        >
          {salvando ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>
              {avaliacaoId
                ? "Atualizar avaliação"
                : "Salvar avaliação"}
            </Text>
          )}
        </Pressable>
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
    height: 65,
    backgroundColor: COLORS.blue,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  backIcon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 10,
  },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 35,
  },

  localIcon: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: COLORS.yellowSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  localName: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
  },

  localAddress: {
    color: COLORS.secondary,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },

  divider: {
    width: "100%",
    height: 1,
    backgroundColor: COLORS.borderBlue,
    marginVertical: 30,
  },

  question: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },

  description: {
    color: COLORS.secondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 320,
  },

  stars: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },

  starButton: {
    paddingHorizontal: 3,
  },

  note: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
  },

  editInfo: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.yellowSoft,
    borderRadius: 12,
    padding: 12,
    marginTop: 25,
  },

  editInfoText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 17,
    marginLeft: 8,
  },

  errorText: {
    color: COLORS.red,
    fontSize: 13,
    textAlign: "center",
    marginTop: 15,
  },

  saveButton: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },

  saveButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: COLORS.secondary,
    fontSize: 14,
    marginTop: 12,
  },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  errorTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
  },

  backButton: {
    marginTop: 20,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
  },

  backButtonText: {
    color: COLORS.white,
    fontWeight: "700",
  },
});