import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
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
  green: "#1FAE59",
  greenSoft: "#EAF8EF",
  red: "#D32F2F",
  redSoft: "#FBE9E9",
};

type StatusAtendimento = "atendido" | "cancelado";

type Atendimento = {
  id: string;
  servico: string;
  local: string;
  data: string;
  hora: string;
  status: StatusAtendimento;
};

// Dados mocados só para exibir a tela — trocar por dados reais (Supabase)
// quando a integração de fila/senhas for feita.
const HISTORICO: Atendimento[] = [
  {
    id: "1",
    servico: "Emissão de documentos",
    local: "Resolve Palmas — Centro",
    data: "05/09/2026",
    hora: "14:32",
    status: "atendido",
  },
  {
    id: "2",
    servico: "Atendimento tributário",
    local: "Resolve Palmas — Centro",
    data: "28/08/2026",
    hora: "09:15",
    status: "atendido",
  },
  {
    id: "3",
    servico: "Credencial do idoso",
    local: "Cartório 2º Ofício",
    data: "20/08/2026",
    hora: "11:47",
    status: "cancelado",
  },
];

const STATUS_INFO: Record<
  StatusAtendimento,
  { label: string; color: string; background: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  atendido: {
    label: "Atendido",
    color: COLORS.green,
    background: COLORS.greenSoft,
    icon: "checkmark-circle",
  },
  cancelado: {
    label: "Cancelado",
    color: COLORS.red,
    background: COLORS.redSoft,
    icon: "close-circle",
  },
};

export default function Historico() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Histórico</Text>
      </View>

      {HISTORICO.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {HISTORICO.map((item) => {
            const info = STATUS_INFO[item.status];

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.servico}>{item.servico}</Text>

                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: info.background },
                    ]}
                  >
                    <Ionicons name={info.icon} size={13} color={info.color} />
                    <Text style={[styles.statusText, { color: info.color }]}>
                      {info.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons
                    name="navigate-outline"
                    size={13}
                    color={COLORS.secondary}
                  />
                  <Text style={styles.infoText}>{item.local}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color={COLORS.secondary}
                  />
                  <Text style={styles.infoText}>
                    {item.data} às {item.hora}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="time-outline" size={40} color={COLORS.blue} />
          </View>

          <Text style={styles.emptyTitle}>Nenhum atendimento ainda</Text>
          <Text style={styles.emptyDescription}>
            Assim que você retirar e concluir uma senha, o histórico dos seus
            atendimentos aparece aqui.
          </Text>

          <Pressable
            style={styles.emptyButton}
            onPress={() => router.push("/locais")}
          >
            <Text style={styles.emptyButtonText}>Ver locais</Text>
          </Pressable>
        </View>
      )}

      {/* BARRA INFERIOR */}
      <View style={styles.tabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => router.push("/locais")}
        >
          <Ionicons name="home-outline" size={22} color={COLORS.secondary} />
          <Text style={styles.tabLabel}>Início</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => router.push("/minha-senha")}
        >
          <Ionicons
            name="ticket-outline"
            size={22}
            color={COLORS.secondary}
          />
          <Text style={styles.tabLabel}>Minha senha</Text>
        </Pressable>

        <View style={styles.tabItem}>
          <Ionicons name="time" size={22} color={COLORS.blue} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>
            Histórico
          </Text>
        </View>

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

  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF1F6",
    padding: 14,
    marginBottom: 12,

    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  servico: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14.5,
    fontWeight: "700",
    marginRight: 8,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },

  statusText: {
    fontSize: 10.5,
    fontWeight: "700",
    marginLeft: 4,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  infoText: {
    color: COLORS.secondary,
    fontSize: 11.5,
    marginLeft: 6,
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
