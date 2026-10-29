
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
  getDadosConquistas,
  type ConquistaUsuario,
} from "../../../services/conquistas";
import {
  getResumoNivelUsuario,
  type ResumoNivelUsuario,
} from "../../../services/niveis";
import { calcularPercentual, formatarPontos } from "../../../utils/niveis";

const COLORS = {
  blue: "#0757D8",
  blueSoft: "#2F78E8",
  blueDark: "#0A47A5",
  background: "#F2F5FB",
  white: "#FFFFFF",
  text: "#0D1E46",
  secondary: "#65708A",
  borderBlue: "#CFE0FF",
  green: "#1FAE59",
  greenSoft: "#EAF8EF",
  yellow: "#FFC400",
};

type FiltroId =
  | "todas"
  | "locais"
  | "servicos"
  | "sequencia"
  | "concluidas";

type Conquista = ConquistaUsuario & {
  textoProximoMarco: string;
  textoConcluido: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
};

const VISUAL_CONQUISTAS: Record<
  string,
  Pick<
    Conquista,
    | "textoProximoMarco"
    | "textoConcluido"
    | "icon"
    | "iconColor"
    | "iconBackground"
  >
> = {
  "frequentador-resolve": {
    textoProximoMarco: "Próximo marco • 5 visitas",
    textoConcluido: "Marco alcançado • 5 visitas",
    icon: "business-outline",
    iconColor: COLORS.blue,
    iconBackground: "#EDF4FF",
  },
  "explorador-servicos": {
    textoProximoMarco: "Próximo marco • todos 1x",
    textoConcluido: "Marco alcançado • todos 1x",
    icon: "document-text-outline",
    iconColor: "#4B5B7C",
    iconBackground: "#F1F5FF",
  },
  "veterano-servicos": {
    textoProximoMarco: "Próximo marco • todos 2x",
    textoConcluido: "Marco alcançado • todos 2x",
    icon: "people-outline",
    iconColor: COLORS.blue,
    iconBackground: "#EDF4FF",
  },
  "conhecendo-palmas": {
    textoProximoMarco: "Próximo marco • 3 locais",
    textoConcluido: "Marco alcançado • 3 locais",
    icon: "location-outline",
    iconColor: "#C30052",
    iconBackground: "#F9EAF1",
  },
  "semana-produtiva": {
    textoProximoMarco: "Próximo marco • 5 dias na semana",
    textoConcluido: "Marco alcançado • 5 dias na semana",
    icon: "flame-outline",
    iconColor: "#F48B00",
    iconBackground: "#FFF3E0",
  },
  "mestre-cidade": {
    textoProximoMarco: "Próximo marco • 10 locais",
    textoConcluido: "Marco alcançado • 10 locais",
    icon: "medal-outline",
    iconColor: "#B18A00",
    iconBackground: "#FFF8DA",
  },
};

const FILTROS: { id: FiltroId; nome: string }[] = [
  { id: "todas", nome: "Todas" },
  { id: "locais", nome: "Locais" },
  { id: "servicos", nome: "Serviços" },
  { id: "sequencia", nome: "Sequência" },
  { id: "concluidas", nome: "Concluídas" },
];

export default function Conquistas() {
  const { user } = useAuth();

  const [filtroAtivo, setFiltroAtivo] = useState<FiltroId>("todas");
  const [conquistas, setConquistas] = useState<Conquista[]>([]);
  const [totalConquistas, setTotalConquistas] = useState(0);
  const [percentualConcluido, setPercentualConcluido] = useState(0);
  const [totalPontos, setTotalPontos] = useState(0);
  const [resumoNivel, setResumoNivel] = useState<ResumoNivelUsuario | null>(
    null,
  );
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarConquistas = useCallback(async () => {
    if (!user?.id) {
      setConquistas([]);
      setTotalConquistas(0);
      setPercentualConcluido(0);
      setTotalPontos(0);
      setResumoNivel(null);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const dados = await getDadosConquistas(user.id);

      // O nível é secundário: se falhar, o card de nível é ocultado e a
      // lista de conquistas continua funcionando.
      const resumo = await getResumoNivelUsuario(user.id).catch((error) => {
        console.error("Erro ao carregar nível:", error);
        return null;
      });

      const conquistasComVisual: Conquista[] = dados.conquistas.map(
        (conquista) => ({
          ...conquista,
          ...(VISUAL_CONQUISTAS[conquista.id] ?? {
            textoProximoMarco: "Próximo marco",
            textoConcluido: "Marco alcançado",
            icon: "trophy-outline",
            iconColor: COLORS.blue,
            iconBackground: "#EDF4FF",
          }),
        }),
      );

      setConquistas(conquistasComVisual);
      setTotalConquistas(dados.totalConquistas);
      setPercentualConcluido(dados.percentualConcluido);
      setTotalPontos(dados.totalPontos);
      setResumoNivel(resumo);
    } catch (error) {
      console.error("Erro ao carregar conquistas:", error);
      setErro(
        "Não foi possível carregar suas conquistas. Tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }, [user?.id]);

  useEffect(() => {
    carregarConquistas();
  }, [carregarConquistas]);

  const conquistasFiltradas = useMemo(() => {
    if (filtroAtivo === "todas") {
      return conquistas;
    }

    if (filtroAtivo === "concluidas") {
      return conquistas.filter((conquista) => conquista.concluida);
    }

    return conquistas.filter(
      (conquista) => conquista.categoria === filtroAtivo,
    );
  }, [filtroAtivo, conquistas]);

  const progressoNivel = resumoNivel?.progresso ?? 0;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blue} />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={COLORS.white} />
        </Pressable>

        <Text style={styles.headerTitle}>Conquistas</Text>
        <View style={styles.headerCircle} />

        <View style={styles.heroBox}>
          <Text style={styles.heroTitle}>Seu progresso no SmartLine</Text>
          <Text style={styles.heroSubtitle}>
            Use serviços, conheça novos locais e desbloqueie marcos.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalConquistas}</Text>
              <Text style={styles.statLabel}>conquistas</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {formatarPontos(totalPontos)}
              </Text>
              <Text style={styles.statLabel}>pontos</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{percentualConcluido}%</Text>
              <Text style={styles.statLabel}>concluído</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {resumoNivel ? (
          <View style={styles.levelCard}>
            <View style={styles.levelIconWrap}>
              <Ionicons name="trophy" size={20} color={COLORS.yellow} />
            </View>

            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>
                {resumoNivel.nivelAtual
                  ? `Nível ${resumoNivel.nivelAtual.nivel} • ${resumoNivel.nivelAtual.nome}`
                  : "Ainda sem nível"}
              </Text>

              <Text style={styles.levelSubtitle}>
                {resumoNivel.proximoNivel
                  ? `Faltam ${formatarPontos(resumoNivel.pontosFaltantes)} pontos para o nível ${resumoNivel.proximoNivel.nivel}`
                  : "Você alcançou o nível máximo"}
              </Text>

              <View style={styles.levelProgressTrack}>
                <View
                  style={[
                    styles.levelProgressFill,
                    { width: `${progressoNivel}%` },
                  ]}
                />
              </View>

              <Text style={styles.levelProgressText}>
                {resumoNivel.proximoNivel
                  ? `${formatarPontos(resumoNivel.totalPontos)} / ${formatarPontos(resumoNivel.proximoNivel.pontos_minimos)} pts`
                  : `${formatarPontos(resumoNivel.totalPontos)} pts`}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Marcos de conquista</Text>
          <Text style={styles.sectionSubtitle}>
            Complete etapas para evoluir cada conquista.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {FILTROS.map((filtro) => {
            const ativo = filtro.id === filtroAtivo;

            return (
              <Pressable
                key={filtro.id}
                style={[
                  styles.filterPill,
                  ativo && styles.filterPillActive,
                ]}
                onPress={() => setFiltroAtivo(filtro.id)}
              >
                <Text
                  style={[
                    styles.filterText,
                    ativo && styles.filterTextActive,
                  ]}
                >
                  {filtro.nome}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {carregando ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyDescription}>
              Carregando suas conquistas...
            </Text>
          </View>
        ) : erro ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyDescription}>{erro}</Text>

            <Pressable onPress={carregarConquistas}>
              <Text style={styles.filterTextActive}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.list}>
          {!carregando && !erro && conquistasFiltradas.length > 0 ? (
            conquistasFiltradas.map((conquista) => {
              const concluida = conquista.concluida;

              const percentual = calcularPercentual(
                conquista.progressoAtual,
                conquista.progressoNecessario,
              );

              return (
                <View key={conquista.id} style={styles.card}>
                  <View
                    style={[
                      styles.cardIcon,
                      { backgroundColor: conquista.iconBackground },
                    ]}
                  >
                    <Ionicons
                      name={conquista.icon}
                      size={20}
                      color={conquista.iconColor}
                    />
                  </View>

                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{conquista.nome}</Text>
                    <Text style={styles.cardDescription}>
                      {conquista.descricao}
                    </Text>

                    <Text style={styles.cardMilestone}>
                      {concluida
                        ? conquista.textoConcluido
                        : conquista.textoProximoMarco}
                    </Text>

                    <View style={styles.progressRow}>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${percentual}%` },
                          ]}
                        />
                      </View>

                      <Text style={styles.progressCounter}>
                        {conquista.progressoAtual}/
                        {conquista.progressoNecessario}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rewardArea}>
                    {concluida ? (
                      <View style={styles.completedBadge}>
                        <Ionicons
                          name="checkmark"
                          size={12}
                          color={COLORS.white}
                        />
                      </View>
                    ) : null}

                    <Text style={styles.rewardLabel}>Recompensa</Text>
                    <Text style={styles.rewardValue}>
                      +{formatarPontos(conquista.recompensa)} pts
                    </Text>
                  </View>
                </View>
              );
            })
          ) : !carregando && !erro ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="trophy-outline"
                size={34}
                color={COLORS.blue}
              />
              <Text style={styles.emptyTitle}>
                Nenhuma conquista nesse filtro
              </Text>
              <Text style={styles.emptyDescription}>
                Selecione outro filtro para ver mais marcos.
              </Text>
            </View>
          ) : null}
        </View>
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
    backgroundColor: COLORS.blue,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    overflow: "hidden",
  },

  backButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },

  headerCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.09)",
    position: "absolute",
    right: -42,
    top: 12,
  },

  heroBox: {
    marginTop: 18,
    backgroundColor: COLORS.blueSoft,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
  },

  heroSubtitle: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12.5,
    marginTop: 4,
  },

  statsRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 8,
  },

  statCard: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },

  statValue: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
  },

  statLabel: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 11,
    marginTop: 2,
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 95,
  },

  levelCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8EDF7",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  levelIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF2CC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },

  levelInfo: {
    flex: 1,
  },

  levelTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },

  levelSubtitle: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 3,
  },

  levelProgressTrack: {
    marginTop: 10,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#E9EEF7",
    overflow: "hidden",
  },

  levelProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.blue,
  },

  levelProgressText: {
    marginTop: 5,
    color: COLORS.secondary,
    fontSize: 11,
    textAlign: "right",
    fontWeight: "600",
  },

  sectionHeader: {
    marginTop: 16,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "700",
  },

  sectionSubtitle: {
    marginTop: 2,
    color: COLORS.secondary,
    fontSize: 12,
  },

  filtersContainer: {
    marginTop: 11,
    paddingBottom: 4,
    gap: 8,
  },

  filterPill: {
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F3",
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    justifyContent: "center",
  },

  filterPillActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },

  filterText: {
    color: COLORS.secondary,
    fontSize: 11.5,
    fontWeight: "600",
  },

  filterTextActive: {
    color: COLORS.white,
  },

  list: {
    marginTop: 4,
  },

  card: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8EDF7",
    padding: 11,
    marginTop: 10,
  },

  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    marginTop: 2,
  },

  cardContent: {
    flex: 1,
    paddingRight: 8,
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },

  cardDescription: {
    color: COLORS.secondary,
    fontSize: 11.8,
    marginTop: 2,
  },

  cardMilestone: {
    color: COLORS.blueDark,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 7,
  },

  progressRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
  },

  progressTrack: {
    flex: 1,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#E8EDF6",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.blue,
  },

  progressCounter: {
    width: 34,
    textAlign: "right",
    color: COLORS.secondary,
    fontSize: 10.5,
    fontWeight: "600",
    marginLeft: 8,
  },

  rewardArea: {
    width: 72,
    alignItems: "flex-end",
  },

  completedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  rewardLabel: {
    color: COLORS.secondary,
    fontSize: 10,
  },

  rewardValue: {
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 1,
  },

  emptyState: {
    marginTop: 12,
    paddingVertical: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8EDF7",
    backgroundColor: COLORS.white,
    alignItems: "center",
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
  },

  emptyDescription: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 3,
  },
});
