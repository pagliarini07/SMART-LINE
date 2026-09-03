import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
  borderBlue: "#DCE4F1",
  green: "#129B56",
  greenSoft: "#EAF8EF",
  yellowSoft: "#FFF7E5",
};

type Local = {
  id: string;
  nome: string;
  endereco: string;
  distancia: string;
  pessoasAguardando: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
};

const LOCAIS: Local[] = [
  {
    id: "resolve",
    nome: "Resolve Palmas — Centro",
    endereco: "Av. JK, 104 Norte, Palmas – TO",
    distancia: "450 m",
    pessoasAguardando: 18,
    icon: "grid-outline",
    iconColor: COLORS.blue,
    iconBackground: COLORS.lightBlue,
  },
  {
    id: "cartorio",
    nome: "Cartório 2º Ofício",
    endereco: "Quadra 104 Norte, Av. LO 2, Nº 30",
    distancia: "850 m",
    pessoasAguardando: 6,
    icon: "document-text-outline",
    iconColor: "#274A8A",
    iconBackground: COLORS.yellowSoft,
  },
  {
    id: "detran",
    nome: "Detran Palmas",
    endereco: "104 Sul, Av. LO 1, Conj. 01, Lt. 05",
    distancia: "1,2 km",
    pessoasAguardando: 24,
    icon: "car-outline",
    iconColor: COLORS.blue,
    iconBackground: COLORS.lightBlue,
  },
];

const CATEGORIAS = [
  {
    id: "cartorios",
    nome: "Cartórios",
    icon: "business-outline" as keyof typeof Ionicons.glyphMap,
    width: 74,
    active: true,
  },
  {
    id: "servicos",
    nome: "Serviços",
    icon: "ellipsis-horizontal" as keyof typeof Ionicons.glyphMap,
    width: 80,
  },
  {
    id: "documentacao",
    nome: "Documentação",
    icon: "document-text-outline" as keyof typeof Ionicons.glyphMap,
    width: 98,
  },
  {
    id: "veiculos",
    nome: "Veículos",
    icon: "car-outline" as keyof typeof Ionicons.glyphMap,
    width: 72,
  },
];

export default function Locais() {
  const abrirServicos = () => {
    router.push("/inicio" as never);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blue} />

      <View style={styles.header}>
        <View style={styles.bigSun}>
          <Ionicons name="sunny" size={130} color={COLORS.yellow} />
        </View>

        <View style={styles.brand}>
          <View style={styles.brandSymbol}>
            <Ionicons name="people" size={31} color={COLORS.white} />

            <View style={styles.logoSun}>
              <Ionicons name="sunny" size={19} color={COLORS.yellow} />
            </View>
          </View>

          <View>
            <Text style={styles.brandName}>SmartLine</Text>
            <Text style={styles.tagline}>
              Sua vez, com mais eficiência.
            </Text>
          </View>
        </View>

        <Text style={styles.hello}>Olá, Lucas!</Text>
        <Text style={styles.help}>Como podemos te ajudar hoje?</Text>
      </View>

      <View style={styles.body}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.search}>
            <Ionicons
              name="search-outline"
              size={21}
              color={COLORS.text}
            />

            <TextInput
              style={styles.searchInput}
              placeholder="Buscar órgão ou cartório"
              placeholderTextColor={COLORS.secondary}
            />
          </View>

          <View style={styles.categories}>
            {CATEGORIAS.map((categoria) => (
              <Pressable
                key={categoria.id}
                style={[
                  styles.category,
                  { width: categoria.width },
                  categoria.active && styles.categoryActive,
                ]}
              >
                <Ionicons
                  name={categoria.icon}
                  size={14}
                  color={COLORS.blue}
                />

                <Text
                  style={[
                    styles.categoryText,
                    categoria.active && styles.categoryTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {categoria.nome}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="locate-outline"
              size={21}
              color={COLORS.blue}
            />

            <Text style={styles.sectionTitle}>Locais próximos</Text>
          </View>

          <View style={styles.localList}>
            {LOCAIS.map((local) => (
              <View key={local.id} style={styles.localCard}>
                <View
                  style={[
                    styles.localIcon,
                    { backgroundColor: local.iconBackground },
                  ]}
                >
                  <Ionicons
                    name={local.icon}
                    size={30}
                    color={local.iconColor}
                  />
                </View>

                <View style={styles.localContent}>
                  <View style={styles.localTitleRow}>
                    <Text style={styles.localName} numberOfLines={1}>
                      {local.nome}
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.text}
                    />
                  </View>

                  <View style={styles.addressRow}>
                    <Ionicons
                      name="navigate-outline"
                      size={12}
                      color={COLORS.secondary}
                    />

                    <Text
                      style={styles.address}
                      numberOfLines={1}
                    >
                      {local.endereco}
                    </Text>

                    <Text style={styles.distance}>
                      {local.distancia}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.openPill}>
                      <View style={styles.openDot} />
                      <Text style={styles.openText}>Aberto</Text>
                    </View>

                    <View style={styles.waitingRow}>
                      <Ionicons
                        name="people"
                        size={14}
                        color={COLORS.blue}
                      />

                      <Text style={styles.waitingText}>
                        {local.pessoasAguardando} pessoas aguardando
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={styles.servicesButton}
                    onPress={abrirServicos}
                  >
                    <Text style={styles.servicesButtonText}>
                      Ver serviços
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={17}
                      color={COLORS.blue}
                    />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <Pressable style={styles.mapButton}>
            <Text style={styles.mapText}>
              Ver mais locais no mapa
            </Text>

            <Ionicons
              name="chevron-forward"
              size={13}
              color={COLORS.blue}
            />
          </Pressable>
        </ScrollView>
      </View>

      <View style={styles.tabBar}>
        <View style={styles.tabItem}>
          <Ionicons name="home-outline" size={22} color={COLORS.blue} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>
            Início
          </Text>
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
          <Ionicons
            name="time-outline"
            size={22}
            color={COLORS.secondary}
          />
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
    backgroundColor: COLORS.blue,
  },

  header: {
    height: 178,
    backgroundColor: COLORS.blue,
    overflow: "hidden",
    position: "relative",
  },

  bigSun: {
    position: "absolute",
    right: -45,
    top: 45,
  },

  brand: {
    position: "absolute",
    left: 24,
    top: 31,
    flexDirection: "row",
    alignItems: "center",
  },

  brandSymbol: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },

  logoSun: {
    position: "absolute",
    top: -1,
    right: -3,
  },

  brandName: {
    color: COLORS.white,
    fontSize: 23,
    lineHeight: 27,
    fontWeight: "700",
  },

  tagline: {
    color: COLORS.yellow,
    fontSize: 8.5,
    fontWeight: "600",
  },

  hello: {
    position: "absolute",
    left: 24,
    top: 91,
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "700",
  },

  help: {
    position: "absolute",
    left: 24,
    top: 129,
    color: COLORS.white,
    fontSize: 14,
  },

  body: {
    flex: 1,
    marginTop: -18,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 90,
  },

  search: {
    height: 52,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,

    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 4,
  },

  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: COLORS.text,
    fontSize: 14,
    outlineStyle: "none" as never,
  },

  categories: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  category: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,

    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },

  categoryActive: {
    borderColor: COLORS.blue,
    borderWidth: 1.5,
  },

  categoryText: {
    color: COLORS.text,
    fontSize: 8.6,
    fontWeight: "600",
    marginLeft: 5,
  },

  categoryTextActive: {
    color: COLORS.blue,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 15,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    marginLeft: 7,
  },

  localList: {
    gap: 7,
  },

  localCard: {
    minHeight: 126,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    backgroundColor: COLORS.white,
    padding: 13,
    flexDirection: "row",

    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 4,
  },

  localIcon: {
    width: 62,
    height: 62,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },

  localContent: {
    flex: 1,
    marginLeft: 12,
  },

  localTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  localName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
    marginRight: 5,
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  address: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: 10.2,
    marginLeft: 3,
    marginRight: 5,
  },

  distance: {
    color: COLORS.blue,
    fontSize: 11,
    fontWeight: "700",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  openPill: {
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.greenSoft,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  openDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#20B565",
    marginRight: 6,
  },

  openText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "600",
  },

  waitingRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },

  waitingText: {
    color: COLORS.secondary,
    fontSize: 10.5,
    marginLeft: 4,
  },

  servicesButton: {
    height: 28,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  servicesButtonText: {
    flex: 1,
    color: COLORS.blue,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginLeft: 17,
  },

  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    marginBottom: 5,
  },

  mapText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 3,
  },

  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },

  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  tabLabel: {
    color: COLORS.secondary,
    fontSize: 9.5,
    marginTop: 4,
  },

  tabLabelActive: {
    color: COLORS.blue,
    fontWeight: "600",
  },
});
