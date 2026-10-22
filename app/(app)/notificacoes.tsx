import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BottomTabBar from "../../components/BottomTabBar";
import { useAuth } from "../../hooks/useAuth";
import {
  listarNotificacoes,
  marcarComoLida,
  Notificacao,
} from "../../services/notificacoes";

const COLORS = {
  blue: "#0757D8",
  background: "#F7F9FC",
  white: "#FFFFFF",
  text: "#0D1E46",
  secondary: "#65708A",
  lightBlue: "#EDF4FF",
  borderBlue: "#CFE0FF",
};

function formatarQuando(dataIso: string) {
  const data = new Date(dataIso);
  return `${data.toLocaleDateString("pt-BR")} às ${data.toLocaleTimeString(
    "pt-BR",
    { hour: "2-digit", minute: "2-digit" }
  )}`;
}

export default function Notificacoes() {
  const { user } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  useEffect(() => {
    async function carregar() {
      if (!user) {
        setCarregando(false);
        return;
      }

      try {
        const dados = await listarNotificacoes(user.id);
        setNotificacoes(dados);
      } catch (error) {
        console.error("Erro ao carregar notificações:", error);
        setErro("Não foi possível carregar suas notificações agora.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [user]);

  const handleMarcarComoLida = async (notificacao: Notificacao) => {
    if (notificacao.lida) {
      return;
    }

    setNotificacoes((atual) =>
      atual.map((item) =>
        item.id === notificacao.id ? { ...item, lida: true } : item
      )
    );

    try {
      await marcarComoLida(notificacao.id);
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Notificações</Text>
      </View>

      {carregando ? (
        <ActivityIndicator style={styles.loading} color={COLORS.blue} />
      ) : notificacoes.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {notificacoes.map((notificacao) => (
            <Pressable
              key={notificacao.id}
              style={[
                styles.card,
                !notificacao.lida && styles.cardNaoLida,
              ]}
              onPress={() => handleMarcarComoLida(notificacao)}
            >
              <View style={styles.cardIcon}>
                <Ionicons
                  name={
                    notificacao.lida
                      ? "notifications-outline"
                      : "notifications"
                  }
                  size={18}
                  color={COLORS.blue}
                />
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitulo}>{notificacao.titulo}</Text>
                <Text style={styles.cardMensagem}>
                  {notificacao.mensagem}
                </Text>
                <Text style={styles.cardQuando}>
                  {formatarQuando(notificacao.criadaEm)}
                </Text>
              </View>

              {!notificacao.lida ? <View style={styles.dot} /> : null}
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="notifications-outline"
              size={40}
              color={COLORS.blue}
            />
          </View>

          <Text style={styles.emptyTitle}>Nenhuma notificação ainda</Text>
          <Text style={styles.emptyDescription}>
            {erro ||
              "Quando sua senha estiver perto de ser chamada, você vê o aviso aqui."}
          </Text>
        </View>
      )}

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

  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 14,
  },

  loading: {
    marginTop: 60,
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF1F6",
    padding: 14,
    marginBottom: 12,
  },

  cardNaoLida: {
    borderColor: COLORS.borderBlue,
    backgroundColor: COLORS.lightBlue,
  },

  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  cardContent: {
    flex: 1,
  },

  cardTitulo: {
    color: COLORS.text,
    fontSize: 14.5,
    fontWeight: "700",
  },

  cardMensagem: {
    color: COLORS.secondary,
    fontSize: 12.5,
    marginTop: 3,
  },

  cardQuando: {
    color: COLORS.secondary,
    fontSize: 10.5,
    marginTop: 6,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.blue,
    marginLeft: 8,
    marginTop: 4,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
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
});
