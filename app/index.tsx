import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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

export default function Index() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blue} />

      {/* TOPO AZUL */}
      <View style={styles.header}>
        <View style={styles.bigSun}>
          <Ionicons
            name="sunny"
            size={135}
            color={COLORS.yellow}
          />
        </View>
      </View>

      {/* CURVA BRANCA */}
      <View style={styles.wave} />

      {/* LOGO */}
      <View style={styles.brand}>
        <View style={styles.brandSymbol}>
          <Ionicons
            name="people"
            size={35}
            color={COLORS.text}
          />

          <View style={styles.logoSun}>
            <Ionicons
              name="sunny"
              size={22}
              color={COLORS.yellow}
            />
          </View>
        </View>

        <View>
          <Text style={styles.brandName}>SmartLine</Text>
          <Text style={styles.tagline}>
            Sua vez, com mais eficiência.
          </Text>
        </View>
      </View>

      {/* APRESENTAÇÃO */}
      <View style={styles.introduction}>
        <Text style={styles.title}>
          Fila inteligente
        </Text>

        <Text style={styles.titleBlue}>
          para serviços públicos
        </Text>

        <Text style={styles.description}>
          O SmartLine ajuda você a acompanhar filas e retirar sua senha
          digital em cartórios e órgãos públicos de forma rápida, fácil
          e prática.
        </Text>
      </View>

      {/* BENEFÍCIOS */}
      <View style={styles.benefits}>
        <View style={styles.benefit}>
          <View style={styles.benefitCircle}>
            <Ionicons
              name="people"
              size={25}
              color={COLORS.blue}
            />
          </View>

          <Text style={styles.benefitTitle}>
            Acompanhe filas
          </Text>

          <Text style={styles.benefitDescription}>
            Veja a posição da fila em tempo real.
          </Text>
        </View>

        <View style={styles.benefit}>
          <View style={styles.benefitCircle}>
            <Ionicons
              name="receipt-outline"
              size={25}
              color={COLORS.blue}
            />
          </View>

          <Text style={styles.benefitTitle}>
            Retire sua senha
          </Text>

          <Text style={styles.benefitDescription}>
            Retire sua senha digital de onde estiver.
          </Text>
        </View>

        <View style={styles.benefit}>
          <View style={styles.benefitCircle}>
            <Ionicons
              name="notifications-outline"
              size={25}
              color={COLORS.blue}
            />
          </View>

          <Text style={styles.benefitTitle}>
            Receba alertas
          </Text>

          <Text style={styles.benefitDescription}>
            Seja avisado quando chegar a sua vez.
          </Text>
        </View>
      </View>

      {/* CARD DE DESTAQUE */}
      <View style={styles.promoCard}>
        <View style={styles.checkCircle}>
          <Ionicons
            name="checkmark"
            size={22}
            color={COLORS.white}
          />
        </View>

        <View style={styles.promoText}>
          <Text style={styles.promoTitle}>
            Mais agilidade, mais{"\n"}tempo para você.
          </Text>

          <Text style={styles.promoDescription}>
            Menos espera, mais eficiência{"\n"}no seu dia a dia.
          </Text>
        </View>

        <Ionicons
          name="sunny"
          size={62}
          color={COLORS.yellow}
        />
      </View>

      {/* BOTÕES */}
      <Pressable style={styles.startButton}>
        <Text style={styles.startButtonText}>
          Começar
        </Text>
      </Pressable>

      <Pressable style={styles.loginButton} onPress={() => router.push("/login")}>
        <Text style={styles.loginText}>
          Já tenho conta
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    position: "relative",
    overflow: "hidden",
  },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 168,
    backgroundColor: COLORS.blue,
    overflow: "hidden",
  },

  bigSun: {
    position: "absolute",
    right: -48,
    top: 44,
  },

  wave: {
    position: "absolute",
    top: 110,
    left: -65,
    width: 520,
    height: 160,
    backgroundColor: COLORS.white,
    borderRadius: 260,
  },

  brand: {
    position: "absolute",
    top: 126,
    left: 24,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
  },

  brandSymbol: {
    width: 46,
    height: 40,
    justifyContent: "center",
    position: "relative",
  },

  logoSun: {
    position: "absolute",
    top: -1,
    right: -2,
  },

  brandName: {
    color: COLORS.text,
    fontSize: 23,
    lineHeight: 27,
    fontWeight: "700",
  },

  tagline: {
    color: COLORS.blue,
    fontSize: 8.5,
    fontWeight: "600",
    marginTop: 1,
  },

  introduction: {
    position: "absolute",
    top: 230,
    left: 24,
    right: 24,
  },

  title: {
    color: COLORS.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
  },

  titleBlue: {
    color: COLORS.blue,
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "700",
  },

  description: {
    color: COLORS.secondary,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 11,
  },

  benefits: {
    position: "absolute",
    top: 425,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  benefit: {
    width: 96,
    alignItems: "center",
  },

  benefitCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.lightBlue,
    justifyContent: "center",
    alignItems: "center",
  },

  benefitTitle: {
    width: 100,
    marginTop: 9,
    color: COLORS.text,
    fontSize: 10.5,
    fontWeight: "600",
    textAlign: "center",
  },

  benefitDescription: {
    width: 96,
    marginTop: 17,
    color: COLORS.secondary,
    fontSize: 8.8,
    lineHeight: 11,
    textAlign: "center",
  },

  promoCard: {
    position: "absolute",
    top: 566,
    left: 24,
    right: 24,
    height: 92,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    backgroundColor: COLORS.lightBlue,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,

    shadowColor: COLORS.text,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 4,
  },

  checkCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
  },

  promoText: {
    flex: 1,
    marginLeft: 12,
  },

  promoTitle: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "700",
  },

  promoDescription: {
    color: COLORS.secondary,
    fontSize: 11,
    lineHeight: 13,
    marginTop: 3,
  },

  startButton: {
    position: "absolute",
    top: 681,
    left: 24,
    right: 24,
    height: 54,
    backgroundColor: COLORS.blue,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: COLORS.text,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 4,
  },

  startButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },

  loginButton: {
    position: "absolute",
    top: 744,
    left: 24,
    right: 24,
    height: 40,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  loginText: {
    color: COLORS.blue,
    fontSize: 14,
    fontWeight: "600",
  },
});
