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

import { buscarRanking, RankingLocal } from "../../lib/avaliacoes";

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

  useEffect(() => {
    carregarRanking();
  }, []);

  async function carregarRanking() {
    try {
      setLoading(true);
      setError("");

      const dados = await buscarRanking();
      setRanking(dados);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar o ranking.");
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={COLORS.blue}
        />

        <Text style={styles.loadingText}>
          Carregando ranking...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={COLORS.secondary}
        />

        <Text style={styles.errorText}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <View style={styles.header}>
        <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
        >
            <Ionicons
            name="arrow-back"
            size={22}
            color={COLORS.text}
            />
        </Pressable>

        <View style={styles.headerText}>
            <Text style={styles.title}>
            Ranking
            </Text>

            <Text style={styles.subtitle}>
            Veja a média de avaliações dos locais
            </Text>
        </View>
        </View>

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