import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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

// Dados mocados só para exibir a tela — trocar por dados reais
// (API / estado global) quando a integração de fila for feita.
const SERVICOS_NOMES: Record<string, string> = {
  documentos: "Emissão de documentos",
  tributario: "Atendimento tributário",
  idoso: "Credencial do idoso",
  protocolo: "Protocolo geral",
};

export default function Fila() {
  const { servicoId } = useLocalSearchParams<{ servicoId?: string }>();
  const nomeServico =
    (servicoId && SERVICOS_NOMES[servicoId]) || "Serviço selecionado";

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blue} />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{nomeServico}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.positionCircle}>
          <Text style={styles.positionNumber}>4º</Text>
          <Text style={styles.positionLabel}>na fila</Text>
        </View>

        <Text style={styles.estimate}>Tempo estimado: ~20 minutos</Text>

        <View style={styles.infoCard}>
          <Ionicons name="notifications-outline" size={20} color={COLORS.blue} />
          <Text style={styles.infoText}>
            Você será avisado quando estiver próximo de ser chamado.
          </Text>
        </View>

        <Pressable style={styles.leaveButton}>
          <Text style={styles.leaveButtonText}>Sair da fila</Text>
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
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 14,
    flexShrink: 1,
  },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 30,
  },

  positionCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.lightBlue,
    borderWidth: 2,
    borderColor: COLORS.borderBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  positionNumber: {
    color: COLORS.blue,
    fontSize: 42,
    fontWeight: "800",
  },

  positionLabel: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },

  estimate: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 20,
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    padding: 14,
    marginTop: 30,
  },

  infoText: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: 12.5,
    marginLeft: 10,
  },

  leaveButton: {
    marginTop: 30,
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
});
