import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    buscarMinhasAvaliacoes,
    type Avaliacao,
} from "../../lib/avaliacoes";

const COLORS = {
  blue: "#0757D8",
  yellow: "#FFC400",
  background: "#F7F9FC",
  white: "#FFFFFF",
  text: "#0D1E46",
  secondary: "#65708A",
  border: "#E2E7F0",
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

export default function MinhasAvaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarAvaliacoes();
  }, []);

  async function carregarAvaliacoes() {
    try {
      setErro("");
      setCarregando(true);

      const dados = await buscarMinhasAvaliacoes();

      setAvaliacoes(dados);
    } catch (error) {
      console.error("Erro ao carregar avaliações:", error);
      setErro("Não foi possível carregar suas avaliações.");
    } finally {
      setCarregando(false);
    }
  }

  function abrirAvaliacao(localId: string) {
    router.push(`/avaliar/${localId}` as never);
  }

  function renderEstrelas(nota: number) {
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((estrela) => (
          <Ionicons
            key={estrela}
            name={estrela <= nota ? "star" : "star-outline"}
            size={18}
            color={COLORS.yellow}
          />
        ))}
      </View>
    );
  }

  function renderAvaliacao({
    item,
  }: {
    item: Avaliacao;
  }) {
    const local =
      LOCAIS[item.local_id as keyof typeof LOCAIS];

    return (
      <Pressable
        style={styles.card}
        onPress={() => abrirAvaliacao(item.local_id)}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name="business-outline"
            size={25}
            color={COLORS.blue}
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.localName}>
            {local?.nome ?? "Local"}
          </Text>

          <Text style={styles.localAddress}>
            {local?.endereco ?? "Endereço não disponível"}
          </Text>

          <View style={styles.ratingRow}>
            {renderEstrelas(item.nota)}

            <Text style={styles.ratingText}>
              {item.nota}{" "}
              {item.nota === 1
                ? "estrela"
                : "estrelas"}
            </Text>
          </View>

          <Text style={styles.editText}>
            Toque para editar sua avaliação
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={22}
          color={COLORS.secondary}
        />
      </Pressable>
    );
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
            Carregando suas avaliações...
          </Text>
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
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={COLORS.white}
          />
        </Pressable>

        <View>
          <Text style={styles.headerTitle}>
            Minhas avaliações
          </Text>

          <Text style={styles.headerSubtitle}>
            {avaliacoes.length}{" "}
            {avaliacoes.length === 1
              ? "avaliação"
              : "avaliações"}
          </Text>
        </View>
      </View>

      {erro !== "" ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={50}
            color={COLORS.red}
          />

          <Text style={styles.emptyTitle}>
            Não foi possível carregar
          </Text>

          <Text style={styles.emptyText}>
            {erro}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={carregarAvaliacoes}
          >
            <Text style={styles.retryButtonText}>
              Tentar novamente
            </Text>
          </Pressable>
        </View>
      ) : avaliacoes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="star-outline"
              size={42}
              color={COLORS.yellow}
            />
          </View>

          <Text style={styles.emptyTitle}>
            Você ainda não avaliou nenhum local
          </Text>

          <Text style={styles.emptyText}>
            Suas avaliações aparecerão aqui depois
            que você avaliar um local.
          </Text>

          <Pressable
            style={styles.exploreButton}
            onPress={() => router.push("/locais" as never)}
          >
            <Text style={styles.exploreButtonText}>
              Ver locais
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={avaliacoes}
          keyExtractor={(item) => item.id}
          renderItem={renderAvaliacao}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={carregarAvaliacoes}
          refreshing={carregando}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    height: 82,
    backgroundColor: COLORS.blue,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#DDE8FF",
    fontSize: 12,
    marginTop: 2,
  },

  list: {
    padding: 18,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#EAF1FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  cardContent: {
    flex: 1,
  },

  localName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },

  localAddress: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 3,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  stars: {
    flexDirection: "row",
  },

  ratingText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 7,
  },

  editText: {
    color: COLORS.blue,
    fontSize: 11,
    marginTop: 5,
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

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 25,
    backgroundColor: COLORS.yellowSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyText: {
    color: COLORS.secondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },

  retryButton: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },

  retryButtonText: {
    color: COLORS.white,
    fontWeight: "700",
  },

  exploreButton: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 13,
    marginTop: 22,
  },

  exploreButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
  },
});