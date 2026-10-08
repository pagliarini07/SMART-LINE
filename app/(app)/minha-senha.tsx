import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
import BottomTabBar from "../../components/BottomTabBar";
import { useAuth } from "../../hooks/useAuth";
import { getSenhaAtiva, SenhaAtiva } from "../../services/senhas";

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

export default function MinhaSenha() {
  const { user } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [senhaAtiva, setSenhaAtiva] = useState<SenhaAtiva | null>(null);

  useEffect(() => {
    async function carregarSenha() {
      if (!user) {
        setCarregando(false);
        return;
      }

      try {
        const senha = await getSenhaAtiva(user.id);
        setSenhaAtiva(senha);
      } catch (error) {
        console.error("Erro ao carregar senha ativa:", error);
        setErro("Não foi possível carregar sua senha agora.");
      } finally {
        setCarregando(false);
      }
    }

    carregarSenha();
  }, [user]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Minha senha</Text>
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

              <View style={styles.positionCircle}>
                <Text style={styles.positionNumber}>
                  {senhaAtiva.posicao}º
                </Text>
                <Text style={styles.positionLabel}>na fila</Text>
              </View>

              <Text style={styles.estimate}>
                Tempo estimado: ~{senhaAtiva.tempoEstimadoMinutos} minutos
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

            {/* TODO: ainda só limpa a tela localmente — cancelar a senha de
                verdade (status = "cancelado" em senhas) é escopo da
                integração de mutações (issue #42). */}
            <Pressable
              style={styles.leaveButton}
              onPress={() => setSenhaAtiva(null)}
            >
              <Text style={styles.leaveButtonText}>Sair da fila</Text>
            </Pressable>
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

            <Text style={styles.emptyTitle}>Nenhuma senha retirada</Text>
            <Text style={styles.emptyDescription}>
              {erro ||
                "Escolha um serviço para retirar sua senha digital e acompanhar a fila em tempo real."}
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
