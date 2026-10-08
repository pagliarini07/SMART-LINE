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

import { useAuth } from "../../../hooks/useAuth";
import {
  DadosSequencia,
  getSequenciaAtendimentos,
} from "../../../services/sequencia";

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

const DADOS_INICIAIS: DadosSequencia = {
  atual: 0,
  recorde: 0,
  totalResponsaveis: 0,
};

export default function Sequencia() {
  const { user } = useAuth();

  const [dados, setDados] =
    useState<DadosSequencia>(DADOS_INICIAIS);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarSequencia() {
      if (!user) {
        setCarregando(false);
        return;
      }

      try {
        setErro("");

        const resultado =
          await getSequenciaAtendimentos(user.id);

        setDados(resultado);
      } catch (error) {
        console.error(
          "Erro ao carregar sequência:",
          error
        );

        setErro(
          "Não foi possível carregar sua sequência agora."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarSequencia();
  }, [user]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={COLORS.white}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Minha sequência
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {carregando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={COLORS.blue}
            />

            <Text style={styles.loadingText}>
              Carregando sua sequência...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.mainCard}>
              <View style={styles.fireCircle}>
                <Ionicons
                  name="flame"
                  size={42}
                  color="#FF7A00"
                />
              </View>

              <Text style={styles.cardLabel}>
                Sequência atual
              </Text>

              <Text style={styles.sequenceNumber}>
                {dados.atual}
              </Text>

              <Text style={styles.sequenceText}>
                {dados.atual === 1
                  ? "atendimento responsável seguido"
                  : "atendimentos responsáveis seguidos"}
              </Text>

              <Text style={styles.encouragement}>
                Continue concluindo ou cancelando suas
                senhas de forma responsável.
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons
                  name="trophy-outline"
                  size={25}
                  color={COLORS.yellow}
                />

                <Text style={styles.statNumber}>
                  {dados.recorde}
                </Text>

                <Text style={styles.statLabel}>
                  Recorde pessoal
                </Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={25}
                  color={COLORS.green}
                />

                <Text style={styles.statNumber}>
                  {dados.totalResponsaveis}
                </Text>

                <Text style={styles.statLabel}>
                  Atendimentos responsáveis
                </Text>
              </View>
            </View>

            <View style={styles.rulesCard}>
              <Text style={styles.rulesTitle}>
                Como funciona?
              </Text>

              <View style={styles.rule}>
                <View
                  style={[
                    styles.ruleIcon,
                    styles.ruleIconSuccess,
                  ]}
                >
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={COLORS.green}
                  />
                </View>

                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>
                    Atendimento concluído
                  </Text>

                  <Text style={styles.ruleDescription}>
                    Aumenta sua sequência em +1.
                  </Text>
                </View>
              </View>

              <View style={styles.rule}>
                <View
                  style={[
                    styles.ruleIcon,
                    styles.ruleIconSuccess,
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={COLORS.green}
                  />
                </View>

                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>
                    Cancelamento responsável
                  </Text>

                  <Text style={styles.ruleDescription}>
                    Também aumenta sua sequência em +1.
                  </Text>
                </View>
              </View>

              <View style={styles.rule}>
                <View
                  style={[
                    styles.ruleIcon,
                    styles.ruleIconDanger,
                  ]}
                >
                  <Ionicons
                    name="warning-outline"
                    size={18}
                    color={COLORS.red}
                  />
                </View>

                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>
                    Não comparecimento
                  </Text>

                  <Text style={styles.ruleDescription}>
                    Quebra sua sequência atual.
                  </Text>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={COLORS.blue}
                />

                <Text style={styles.infoText}>
                  Senhas aguardando ou chamadas ainda não
                  alteram sua sequência.
                </Text>
              </View>
            </View>

            {erro ? (
              <Text style={styles.errorText}>
                {erro}
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  loadingContainer: {
    alignItems: "center",
    paddingTop: 80,
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.secondary,
    fontSize: 13,
  },

  mainCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#EEF1F6",
  },

  fireCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#FFF3E7",
    alignItems: "center",
    justifyContent: "center",
  },

  cardLabel: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 15,
  },

  sequenceNumber: {
    color: COLORS.text,
    fontSize: 44,
    fontWeight: "800",
    marginTop: 3,
  },

  sequenceText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },

  encouragement: {
    color: COLORS.secondary,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 10,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },

  statCard: {
    flex: 1,
    minHeight: 120,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEF1F6",
  },

  statNumber: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "800",
    marginTop: 6,
  },

  statLabel: {
    color: COLORS.secondary,
    fontSize: 11,
    textAlign: "center",
    marginTop: 3,
  },

  rulesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#EEF1F6",
  },

  rulesTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },

  rule: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  ruleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  ruleIconSuccess: {
    backgroundColor: COLORS.greenSoft,
  },

  ruleIconDanger: {
    backgroundColor: COLORS.redSoft,
  },

  ruleContent: {
    flex: 1,
    marginLeft: 12,
  },

  ruleTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },

  ruleDescription: {
    color: COLORS.secondary,
    fontSize: 11.5,
    marginTop: 2,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightBlue,
    borderRadius: 12,
    padding: 12,
  },

  infoText: {
    flex: 1,
    color: COLORS.blue,
    fontSize: 11.5,
    lineHeight: 16,
    marginLeft: 8,
  },

  errorText: {
    color: COLORS.red,
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
});
