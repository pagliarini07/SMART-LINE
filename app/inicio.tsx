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
  yellowSoft: "#FFF3D6",
};

type Servico = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  titulo: string;
  descricao: string;
  setor: string;
  pessoasAguardando: number;
};

const UNIDADE = {
  nome: "Resolve Palmas — Centro",
  endereco: "Av. JK, 104 Norte, Palmas – TO",
  aberto: true,
  pessoasAguardando: 18,
};

const SERVICOS: Servico[] = [
  {
    id: "documentos",
    icon: "document-text-outline",
    iconColor: COLORS.blue,
    iconBackground: COLORS.lightBlue,
    titulo: "Emissão de documentos",
    descricao: "RG, CPF, CNH e 2ª via de documentos.",
    setor: "Identificação",
    pessoasAguardando: 8,
  },
  {
    id: "tributario",
    icon: "cash-outline",
    iconColor: "#C9930B",
    iconBackground: COLORS.yellowSoft,
    titulo: "Atendimento tributário",
    descricao: "IPTU, ITBI, Alvará e demais tributos.",
    setor: "Tributos",
    pessoasAguardando: 5,
  },
  {
    id: "idoso",
    icon: "person-circle-outline",
    iconColor: COLORS.white,
    iconBackground: COLORS.blue,
    titulo: "Credencial do idoso",
    descricao: "Emissão e renovação da credencial.",
    setor: "Assistência Social",
    pessoasAguardando: 3,
  },
  {
    id: "protocolo",
    icon: "reader-outline",
    iconColor: COLORS.blue,
    iconBackground: COLORS.lightBlue,
    titulo: "Protocolo geral",
    descricao: "Protocolos, requerimentos e processos.",
    setor: "Protocolo",
    pessoasAguardando: 2,
  },
];

export default function Inicio() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blue} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TOPO AZUL */}
        <View style={styles.header}>
          <View style={styles.bigSun}>
            <Ionicons name="sunny" size={110} color={COLORS.yellow} />
          </View>

          <View style={styles.headerTop}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </Pressable>

            <View style={styles.brand}>
              <View style={styles.brandSymbol}>
                <Ionicons name="people" size={26} color={COLORS.white} />
                <View style={styles.logoSun}>
                  <Ionicons name="sunny" size={16} color={COLORS.yellow} />
                </View>
              </View>

              <View>
                <Text style={styles.brandName}>SmartLine</Text>
                <Text style={styles.tagline}>
                  Sua vez, com mais eficiência.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CARD DA UNIDADE */}
        <View style={styles.unitCard}>
          <View style={styles.unitIcon}>
            <Ionicons name="grid-outline" size={26} color={COLORS.blue} />
          </View>

          <View style={styles.unitInfo}>
            <Text style={styles.unitName}>{UNIDADE.nome}</Text>

            <View style={styles.unitAddressRow}>
              <Ionicons
                name="navigate-outline"
                size={12}
                color={COLORS.secondary}
              />
              <Text style={styles.unitAddress}>{UNIDADE.endereco}</Text>
            </View>

            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {UNIDADE.aberto ? "Aberto" : "Fechado"}
              </Text>
            </View>
          </View>

          <View style={styles.unitWaiting}>
            <Text style={styles.unitWaitingNumber}>
              {UNIDADE.pessoasAguardando}
            </Text>
            <Text style={styles.unitWaitingLabel}>
              pessoas{"\n"}aguardando
            </Text>
          </View>
        </View>

        {/* TÍTULO DA SEÇÃO */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Serviços disponíveis</Text>
          <Text style={styles.sectionSubtitle}>
            Selecione um serviço para ver a fila e mais detalhes.
          </Text>
        </View>

        {/* LISTA DE SERVIÇOS */}
        <View style={styles.serviceList}>
          {SERVICOS.map((servico) => (
            <View key={servico.id} style={styles.serviceCard}>
              <View
                style={[
                  styles.serviceIcon,
                  { backgroundColor: servico.iconBackground },
                ]}
              >
                <Ionicons
                  name={servico.icon}
                  size={22}
                  color={servico.iconColor}
                />
              </View>

              <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle}>{servico.titulo}</Text>
                <Text style={styles.serviceDescription}>
                  {servico.descricao}
                </Text>
                <Text style={styles.serviceSector}>
                  Setor: {servico.setor}
                </Text>

                <View style={styles.serviceWaitingRow}>
                  <Ionicons
                    name="ellipse"
                    size={5}
                    color={COLORS.secondary}
                  />
                  <Ionicons
                    name="ellipse"
                    size={5}
                    color={COLORS.secondary}
                    style={{ marginLeft: 2 }}
                  />
                  <Text style={styles.serviceWaitingText}>
                    {servico.pessoasAguardando} pessoas aguardando
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.queueButton}
                onPress={() =>
                  router.push({
                    pathname: "/fila",
                    params: { servicoId: servico.id },
                  } as never)
                }
              >
                <Text style={styles.queueButtonText}>Ver fila</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.blue} />
              </Pressable>
            </View>
          ))}
        </View>

        {/* LEMBRETE */}
        <View style={styles.reminderCard}>
          <Ionicons name="time-outline" size={20} color={COLORS.blue} />

          <View style={styles.reminderText}>
            <Text style={styles.reminderTitle}>Vai sair?</Text>
            <Text style={styles.reminderDescription}>
              Ajude a manter as filas atualizadas.
            </Text>
          </View>

          <Pressable style={styles.reminderButton}>
            <Text style={styles.reminderButtonText}>Informar saída</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* BARRA INFERIOR */}
      <View style={styles.tabBar}>
        <View style={styles.tabItem}>
          <Ionicons name="home" size={22} color={COLORS.blue} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Início</Text>
        </View>

        <View style={styles.tabItem}>
          <Ionicons
            name="ticket-outline"
            size={22}
            color={COLORS.secondary}
          />
          <Text style={styles.tabLabel}>Minha senha</Text>
        </View>

        <View style={styles.tabItem}>
          <Ionicons name="time-outline" size={22} color={COLORS.secondary} />
          <Text style={styles.tabLabel}>Histórico</Text>
        </View>

        <View style={styles.tabItem}>
          <Ionicons
            name="person-outline"
            size={22}
            color={COLORS.secondary}
          />
          <Text style={styles.tabLabel}>Perfil</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingBottom: 24,
  },

  header: {
    height: 150,
    backgroundColor: COLORS.blue,
    overflow: "hidden",
  },

  bigSun: {
    position: "absolute",
    right: -40,
    top: 30,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 14,
  },

  brandSymbol: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  logoSun: {
    position: "absolute",
    top: -3,
    right: -4,
  },

  brandName: {
    color: COLORS.white,
    fontSize: 20,
    lineHeight: 23,
    fontWeight: "700",
  },

  tagline: {
    color: COLORS.yellow,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 1,
  },

  unitCard: {
    marginTop: -32,
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",

    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  unitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  unitInfo: {
    flex: 1,
    marginLeft: 12,
  },

  unitName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },

  unitAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  unitAddress: {
    color: COLORS.secondary,
    fontSize: 11.5,
    marginLeft: 4,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 8,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.green,
    marginRight: 5,
  },

  statusText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "600",
  },

  unitWaiting: {
    alignItems: "flex-end",
  },

  unitWaitingNumber: {
    color: COLORS.blue,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "right",
  },

  unitWaitingLabel: {
    color: COLORS.secondary,
    fontSize: 9.5,
    textAlign: "right",
    marginTop: 2,
  },

  sectionHeader: {
    marginTop: 24,
    paddingHorizontal: 20,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: COLORS.secondary,
    fontSize: 12.5,
    marginTop: 3,
  },

  serviceList: {
    marginTop: 14,
    paddingHorizontal: 16,
  },

  serviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF1F6",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,

    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  serviceInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  serviceTitle: {
    color: COLORS.text,
    fontSize: 14.5,
    fontWeight: "700",
  },

  serviceDescription: {
    color: COLORS.secondary,
    fontSize: 11,
    marginTop: 2,
  },

  serviceSector: {
    color: COLORS.secondary,
    fontSize: 10.5,
    marginTop: 3,
  },

  serviceWaitingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  serviceWaitingText: {
    color: COLORS.secondary,
    fontSize: 10.5,
    marginLeft: 5,
  },

  queueButton: {
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  queueButtonText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: "700",
    marginRight: 2,
  },

  reminderCard: {
    marginTop: 4,
    marginHorizontal: 16,
    backgroundColor: COLORS.lightBlue,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  reminderText: {
    flex: 1,
    marginLeft: 10,
  },

  reminderTitle: {
    color: COLORS.text,
    fontSize: 13.5,
    fontWeight: "700",
  },

  reminderDescription: {
    color: COLORS.secondary,
    fontSize: 10.5,
    marginTop: 1,
  },

  reminderButton: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  reminderButtonText: {
    color: COLORS.blue,
    fontSize: 11.5,
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
