import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

import { buscarRanking, RankingLocal } from "../../services/avaliacoes";

const COLORS = {
  blue: "#0757D8",
  yellow: "#FFC400",
  background: "#F7F9FC",
  white: "#FFFFFF",
  text: "#0D1E46",
  secondary: "#65708A",
  border: "#E8EDF7",
};

export default function RankingScreen() {
  const [ranking, setRanking] = useState<RankingLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroMais, setErroMais] = useState("");

  useEffect(() => {
    carregarRanking();
  }, []);

  async function carregarRanking() {
    try {
      setLoading(true);
      setError("");

      const { itens, temMais: haMais } = await buscarRanking();
      setRanking(itens);
      setPagina(0);
      setTemMais(haMais);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar o ranking.");
    } finally {
      setLoading(false);
    }
  }

  async function carregarMais() {
    if (carregandoMais || !temMais) {
      return;
    }

    setCarregandoMais(true);
    setErroMais("");

    try {
      const proximaPagina = pagina + 1;
      const { itens, temMais: haMais } = await buscarRanking(proximaPagina);

      setRanking((atual) => [...atual, ...itens]);
      setPagina(proximaPagina);
      setTemMais(haMais);
    } catch (err) {
      console.error(err);
      setErroMais("Não foi possível carregar mais agora. Tente de novo.");
    } finally {
      setCarregandoMais(false);
    }
  }

  function renderItem({
    item,
    index,
  }: {
    item: RankingLocal;
    index: number;
  }) {
    return (
      <View style={styles.card}>
        <View style={styles.position}>
          <Text style={styles.positionText}>
            {index + 1}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.nome}>
            {item.nome}
          </Text>

          {item.media_nota === null ? (
            <Text style={styles.semAvaliacao}>
              Sem avaliações
            </Text>
          ) : (
            <View style={styles.ratingRow}>
              <Ionicons
                name="star"
                size={17}
                color={COLORS.yellow}
              />

              <Text style={styles.media}>
                {item.media_nota.toFixed(1)}
              </Text>

              <Text style={styles.total}>
                ({item.total_avaliacoes}{" "}
                {item.total_avaliacoes === 1
                  ? "avaliação"
                  : "avaliações"}
                )
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // O cabeçalho (com o voltar) aparece em todos os estados — antes, as telas
  // de carregando e de erro não tinham nenhuma saída.
  const cabecalho = (
    <View style={styles.header}>
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      </Pressable>

      <View style={styles.headerText}>
        <Text style={styles.title}>Ranking</Text>

        <Text style={styles.subtitle}>
          Veja a média de avaliações dos locais
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {cabecalho}

        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.blue} />

          <Text style={styles.loadingText}>Carregando ranking...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        {cabecalho}

        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={COLORS.secondary}
          />

          <Text style={styles.errorText}>{error}</Text>

          <Pressable
            style={styles.retryButton}
            onPress={carregarRanking}
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cabecalho}

      <FlatList
        data={ranking}
        keyExtractor={(item) => item.local_id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="star-outline"
              size={48}
              color={COLORS.secondary}
            />

            <Text style={styles.emptyText}>
              Ainda não existem locais para exibir.
            </Text>
          </View>
        }
        ListFooterComponent={
          ranking.length === 0 ? null : (
            <View>
              {erroMais ? (
                <Text style={styles.loadMoreError}>{erroMais}</Text>
              ) : null}

              {temMais && (
                <Pressable
                  style={[
                    styles.loadMoreButton,
                    carregandoMais && styles.loadMoreButtonDisabled,
                  ]}
                  onPress={carregarMais}
                  disabled={carregandoMais}
                  accessibilityRole="button"
                >
                  {carregandoMais ? (
                    <ActivityIndicator color={COLORS.blue} />
                  ) : (
                    <Text style={styles.loadMoreText}>Carregar mais</Text>
                  )}
                </Pressable>
              )}
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

    header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    },

    backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    },

    headerText: {
    flex: 1,
    marginLeft: 12,
    },

  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "700",
  },

  subtitle: {
    color: COLORS.secondary,
    fontSize: 14,
    marginTop: 5,
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  position: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EDF4FF",
    alignItems: "center",
    justifyContent: "center",
  },

  positionText: {
    color: COLORS.blue,
    fontSize: 15,
    fontWeight: "700",
  },

  info: {
    flex: 1,
    marginLeft: 12,
  },

  nome: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  media: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 5,
  },

  total: {
    color: COLORS.secondary,
    fontSize: 12,
    marginLeft: 5,
  },

  semAvaliacao: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 5,
  },

  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingText: {
    color: COLORS.secondary,
    marginTop: 10,
    fontSize: 14,
  },

  errorText: {
    color: COLORS.secondary,
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },

  retryButton: {
    height: 44,
    paddingHorizontal: 22,
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  retryButtonText: {
    color: COLORS.white,
    fontSize: 13.5,
    fontWeight: "700",
  },

  loadMoreButton: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 10,
  },

  loadMoreButtonDisabled: {
    opacity: 0.7,
  },

  loadMoreText: {
    color: COLORS.blue,
    fontSize: 14,
    fontWeight: "700",
  },

  loadMoreError: {
    color: "#D32F2F",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },

  emptyText: {
    color: COLORS.secondary,
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
});