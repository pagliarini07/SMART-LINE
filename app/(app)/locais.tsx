import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useState } from "react";
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
import BottomTabBar from "../../components/BottomTabBar";

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
  tipo: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
};

const LOCAIS: Local[] = [
  {
    id: "22222222-2222-2222-2222-222222222001",
    nome: "Resolve Palmas — Centro",
    endereco: "Av. JK, 104 Norte, Palmas – TO",
    distancia: "450 m",
    pessoasAguardando: 18,
    tipo: "servicos",
    icon: "grid-outline",
    iconColor: COLORS.blue,
    iconBackground: COLORS.lightBlue,
  },
  {
    id: "22222222-2222-2222-2222-222222222002",
    nome: "Cartório 2º Ofício",
    endereco: "Quadra 104 Norte, Av. LO 2, Nº 30",
    distancia: "850 m",
    pessoasAguardando: 6,
    tipo: "cartorios",
    icon: "document-text-outline",
    iconColor: "#274A8A",
    iconBackground: COLORS.yellowSoft,
  },
  {
    id: "22222222-2222-2222-2222-222222222003",
    nome: "Detran Palmas",
    endereco: "104 Sul, Av. LO 1, Conj. 01, Lt. 05",
    distancia: "1,2 km",
    pessoasAguardando: 24,
    tipo: "veiculos",
    icon: "car-outline",
    iconColor: COLORS.blue,
    iconBackground: COLORS.lightBlue,
  },
];

const CATEGORIAS = [
  {
    id: "todos",
    nome: "Todos",
    icon: "apps-outline" as keyof typeof Ionicons.glyphMap,
    width: 64,
  },  
  {
    id: "cartorios",
    nome: "Cartórios",
    icon: "business-outline" as keyof typeof Ionicons.glyphMap,
    width: 74,
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
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");
  const [busca, setBusca] = useState("");
  const abrirServicos = () => {
    router.push("/servicos" as never);
  };
  const abrirAvaliacao = (localId: string) => {
    router.push(`/avaliar/${localId}` as never);
  };
  const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const termoBusca = normalizar(busca);  
  const locaisFiltrados = LOCAIS.filter((local) => {
    const correspondeCategoria =
      categoriaAtiva === "todos" ||
      local.tipo === categoriaAtiva;

    const textoLocal = normalizar(
      `${local.nome} ${local.endereco}`
    );

    const correspondeBusca =
      termoBusca === "" ||
      textoLocal.includes(termoBusca);

    return correspondeCategoria && correspondeBusca;
  });

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
              value ={busca}
              onChangeText={setBusca}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categories}
          >
            {CATEGORIAS.map((categoria) => (
              <Pressable
                key={categoria.id}
                onPress={() => setCategoriaAtiva(categoria.id)}
                style={[
                  styles.category,
                  { width: categoria.width },
                  categoriaAtiva === categoria.id && styles.categoryActive,
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
                    categoriaAtiva === categoria.id &&
                      styles.categoryTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {categoria.nome}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleLeft}>
                <Ionicons
                  name="locate-outline"
                  size={21}
                  color={COLORS.blue}
                />

                <Text style={styles.sectionTitle}>
                  Locais disponíveis
                </Text>
              </View>

              <Pressable
                style={styles.rankingButton}
                onPress={() => router.push("/ranking")}
              >
                <Ionicons
                  name="trophy-outline"
                  size={15}
                  color={COLORS.blue}
                />

                <Text style={styles.rankingButtonText}>
                  Ranking
                </Text>
              </Pressable>
            </View>

          <View style={styles.localList}>
            {locaisFiltrados.length > 0 ? (
              locaisFiltrados.map((local) => (
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

                    <Pressable
                      style={styles.ratingButton}
                      onPress={() => abrirAvaliacao(local.id)}
                    >
                      <Ionicons
                        name="star-outline"
                        size={16}
                        color={COLORS.yellow}
                      />

                      <Text style={styles.ratingButtonText}>
                        Avaliar local
                      </Text>
                    </Pressable>

                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="search-outline"
                    size={30}
                    color={COLORS.blue}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  Nenhum local encontrado
                </Text>

                <Text style={styles.emptyDescription}>
                  Não encontramos locais para sua busca ou categoria.
                </Text>
              </View>
            )}
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

      <BottomTabBar />
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

  categoriesScroll: {
    marginTop: 16,
  },

  categories: {
    flexDirection: "row",
    paddingRight: 8,
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
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 15,
  },

  sectionTitleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  rankingButton: {
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.blue,
    backgroundColor: COLORS.lightBlue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    marginLeft: 8,
  },

  rankingButtonText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
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

  ratingButton: {
    height: 28,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.yellow,
    backgroundColor: COLORS.yellowSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  ratingButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 5,
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

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 35,
    paddingHorizontal: 20,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyDescription: {
    color: COLORS.secondary,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 17,
  },  
});
