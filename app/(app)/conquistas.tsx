import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
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

type CategoriaConquista = "locais" | "servicos" | "sequencia";
type FiltroId = "todas" | "locais" | "servicos" | "sequencia" | "concluidas";

type Conquista = {
  id: string;
  nome: string;
  descricao: string;
  textoProximoMarco: string;
  textoConcluido: string;
  categoria: CategoriaConquista;
  recompensa: number;
  progressoAtual: number;
  progressoNecessario: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
};

const RESUMO = {
  totalConquistas: 7,
  pontos: 1450,
  percentualConcluido: 42,
  nivelAtual: 6,
  nomeNivel: "Cidadão Ativo",
  pontosNivelAtual: 1450,
  pontosProximoNivel: 2000,
};

const FILTROS: { id: FiltroId; nome: string }[] = [
  { id: "todas", nome: "Todas" },
  { id: "locais", nome: "Locais" },
  { id: "servicos", nome: "Serviços" },
  { id: "sequencia", nome: "Sequência" },
  { id: "concluidas", nome: "Concluídas" },
];

const CONQUISTAS: Conquista[] = [
  {
    id: "frequentador-resolve",
    nome: "Frequentador do Resolve Palmas",
    descricao: "Vá ao Resolve Palmas — Centro 5 vezes.",
    textoProximoMarco: "Próximo marco • 5 visitas",
    textoConcluido: "Marco alcançado • 5 visitas",
    categoria: "locais",
    recompensa: 250,
    progressoAtual: 5,
    progressoNecessario: 5,
    icon: "business-outline",
    iconColor: COLORS.blue,
    iconBackground: "#EDF4FF",
  },
  {
    id: "explorador-servicos",
    nome: "Explorador de serviços",
    descricao: "Utilize todos os tipos de serviço disponíveis pelo menos uma vez.",
    textoProximoMarco: "Próximo marco • todos 1x",
    textoConcluido: "Marco alcançado • todos 1x",
    categoria: "servicos",
    recompensa: 400,
    progressoAtual: 6,
    progressoNecessario: 8,
    icon: "document-text-outline",
    iconColor: "#4B5B7C",
    iconBackground: "#F1F5FF",
  },
  {
    id: "veterano-servicos",
    nome: "Veterano dos serviços",
    descricao: "Utilize todos os serviços disponíveis pelo menos 2 vezes.",
    textoProximoMarco: "Próximo marco • todos 2x",
    textoConcluido: "Marco alcançado • todos 2x",
    categoria: "servicos",
    recompensa: 700,
    progressoAtual: 4,
    progressoNecessario: 8,
    icon: "people-outline",
    iconColor: COLORS.blue,
    iconBackground: "#EDF4FF",
  },
  {
    id: "conhecendo-palmas",
    nome: "Conhecendo Palmas",
    descricao: "Visite 3 locais públicos diferentes cadastrados no SmartLine.",
    textoProximoMarco: "Próximo marco • 3 locais",
    textoConcluido: "Marco alcançado • 3 locais",
    categoria: "locais",
    recompensa: 300,
    progressoAtual: 2,
    progressoNecessario: 3,
    icon: "location-outline",
    iconColor: "#C30052",
    iconBackground: "#F9EAF1",
  },
  {
    id: "semana-produtiva",
    nome: "Semana produtiva",
    descricao: "Use o SmartLine em 5 dias diferentes dentro da mesma semana.",
    textoProximoMarco: "Próximo marco • 5 dias na semana",
    textoConcluido: "Marco alcançado • 5 dias na semana",
    categoria: "sequencia",
    recompensa: 200,
    progressoAtual: 4,
    progressoNecessario: 5,
    icon: "flame-outline",
    iconColor: "#F48B00",
    iconBackground: "#FFF3E0",
  },
  {
    id: "mestre-cidade",
    nome: "Mestre da cidade",
    descricao: "Visite 10 locais públicos diferentes.",
    textoProximoMarco: "Próximo marco • 10 locais",
    textoConcluido: "Marco alcançado • 10 locais",
    categoria: "locais",
    recompensa: 1000,
    progressoAtual: 2,
    progressoNecessario: 10,
    icon: "medal-outline",
    iconColor: "#B18A00",
    iconBackground: "#FFF8DA",
  },
];

const formatarPontos = (valor: number) =>
  valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

const calcularPercentual = (atual: number, necessario: number) =>
  Math.min((atual / necessario) * 100, 100);

export default function Conquistas() {
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroId>("todas");

  const conquistasFiltradas = useMemo(() => {
    if (filtroAtivo === "todas") {
      return CONQUISTAS;
    }

    if (filtroAtivo === "concluidas") {
      return CONQUISTAS.filter(
        (conquista) => conquista.progressoAtual >= conquista.progressoNecessario,
      );
    }

    return CONQUISTAS.filter((conquista) => conquista.categoria === filtroAtivo);
  }, [filtroAtivo]);

  const progressoNivel = calcularPercentual(
    RESUMO.pontosNivelAtual,
    RESUMO.pontosProximoNivel,
  );

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
              <Text style={styles.statValue}>{RESUMO.totalConquistas}</Text>
              <Text style={styles.statLabel}>conquistas</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatarPontos(RESUMO.pontos)}</Text>
              <Text style={styles.statLabel}>pontos</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{RESUMO.percentualConcluido}%</Text>
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
        <View style={styles.levelCard}>
          <View style={styles.levelIconWrap}>
            <Ionicons name="trophy" size={20} color={COLORS.yellow} />
          </View>

          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>
              Nível {RESUMO.nivelAtual} • {RESUMO.nomeNivel}
            </Text>
            <Text style={styles.levelSubtitle}>
              Faltam {formatarPontos(RESUMO.pontosProximoNivel - RESUMO.pontosNivelAtual)} pontos
              para o nível {RESUMO.nivelAtual + 1}
            </Text>

            <View style={styles.levelProgressTrack}>
              <View style={[styles.levelProgressFill, { width: `${progressoNivel}%` }]} />
            </View>

            <Text style={styles.levelProgressText}>
              {formatarPontos(RESUMO.pontosNivelAtual)} / {formatarPontos(RESUMO.pontosProximoNivel)} pts
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Marcos de conquista</Text>
          <Text style={styles.sectionSubtitle}>Complete etapas para evoluir cada conquista.</Text>
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
                style={[styles.filterPill, ativo && styles.filterPillActive]}
                onPress={() => setFiltroAtivo(filtro.id)}
              >
                <Text style={[styles.filterText, ativo && styles.filterTextActive]}>
                  {filtro.nome}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.list}>
          {conquistasFiltradas.length > 0 ? (
            conquistasFiltradas.map((conquista) => {
              const concluida = conquista.progressoAtual >= conquista.progressoNecessario;
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
                    <Text style={styles.cardDescription}>{conquista.descricao}</Text>

                    <Text style={styles.cardMilestone}>
                      {concluida ? conquista.textoConcluido : conquista.textoProximoMarco}
                    </Text>

                    <View style={styles.progressRow}>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${percentual}%` }]} />
                      </View>
                      <Text style={styles.progressCounter}>
                        {conquista.progressoAtual}/{conquista.progressoNecessario}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rewardArea}>
                    {concluida ? (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark" size={12} color={COLORS.white} />
                      </View>
                    ) : null}

                    <Text style={styles.rewardLabel}>Recompensa</Text>
                    <Text style={styles.rewardValue}>+{formatarPontos(conquista.recompensa)} pts</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={34} color={COLORS.blue} />
              <Text style={styles.emptyTitle}>Nenhuma conquista nesse filtro</Text>
              <Text style={styles.emptyDescription}>Selecione outro filtro para ver mais marcos.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.tabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => router.push("/locais")}
        >
          <Ionicons name="home-outline" size={22} color={COLORS.secondary} />
          <Text style={styles.tabLabel}>Início</Text>
        </Pressable>

        <Pressable style={styles.tabItem} onPress={() => router.push("/minha-senha")}>
          <Ionicons name="ticket-outline" size={22} color={COLORS.secondary} />
          <Text style={styles.tabLabel}>Minha senha</Text>
        </Pressable>

        <Pressable style={styles.tabItem} onPress={() => router.push("/historico")}>
          <Ionicons name="time-outline" size={22} color={COLORS.secondary} />
          <Text style={styles.tabLabel}>Histórico</Text>
        </Pressable>

        <View style={styles.tabItem}>
          <Ionicons name="trophy" size={22} color={COLORS.blue} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Conquistas</Text>
        </View>

        <Pressable style={styles.tabItem} onPress={() => router.push("/perfil")}>
          <Ionicons name="person-outline" size={22} color={COLORS.secondary} />
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

  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    borderTopWidth: 1,
    borderTopColor: "#E8EDF7",
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },

  tabItem: {
    flex: 1,
    alignItems: "center",
  },

  tabLabel: {
    color: COLORS.secondary,
    fontSize: 9,
    marginTop: 3,
  },

  tabLabelActive: {
    color: COLORS.blue,
    fontWeight: "700",
  },
});
