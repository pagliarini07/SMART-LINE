import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

type SenhaAtiva = {
  codigo: string;
  servico: string;
  posicao: number;
  tempoEstimado: string;
};

// Dados mocados só para exibir a tela — trocar por dados reais (API / estado
// global) quando a integração de fila for feita.
const SENHA_MOCK: SenhaAtiva = {
  codigo: "A032",
  servico: "Emissão de documentos",
  posicao: 4,
  tempoEstimado: "~20 minutos",
};

export default function MinhaSenha() {
  const [senhaAtiva, setSenhaAtiva] = useState<SenhaAtiva | null>(SENHA_MOCK);

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
        {senhaAtiva ? (
          <>
            <View style={styles.senhaCard}>
              <Text style={styles.senhaCodigo}>{senhaAtiva.codigo}</Text>
              <Text style={styles.senhaServico}>{senhaAtiva.servico}</Text>

              <View style={styles.positionCircle}>
                <Text style={styles.positionNumber}>
                  {senhaAtiva.posicao}º
                </Text>
                <Text style={styles.positionLabel}>na fila</Text>
              </View>

              <Text style={styles.estimate}>
                Tempo estimado: {senhaAtiva.tempoEstimado}
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
              Escolha um serviço para retirar sua senha digital e acompanhar
              a fila em tempo real.
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
      <View style={styles.tabBar}>

        <Pressable
          style={styles.tabItem}
          onPress={() => router.push("/locais")}
        >
          <Ionicons
            name="home-outline"
            size={22}
            color={COLORS.secondary}
          />
          <Text style={styles.tabLabel}>Início</Text>
        </Pressable>        

        <View style={styles.tabItem}>
          <Ionicons name="ticket" size={22} color={COLORS.blue} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>
            Minha senha
          </Text>
        </View>

        <Pressable
          style={styles.tabItem}
          onPress={() => router.push("/historico")}
        >
          <Ionicons name="time-outline" size={22} color={COLORS.secondary} />
          <Text style={styles.tabLabel}>Histórico</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => router.push("/conquistas")}
        >
          <Ionicons
            name="trophy-outline"
            size={22}
            color={COLORS.secondary}
          />
          <Text style={styles.tabLabel}>Conquistas</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => router.push("/perfil")}
        >
          <Ionicons
            name="person-outline"
            size={22}
            color={COLORS.secondary}
          />
          <Text style={styles.tabLabel}>Perfil</Text>
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

  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#EEF1F6",
    paddingTop: 8,
    paddingBottom: 10,
  },

  tabItem: {
    flex: 1,
    alignItems: "center",
  },

  tabLabel: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },

  tabLabelActive: {
    color: COLORS.blue,
  },
});
