import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type TabItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const tabs: TabItem[] = [
  {
    label: "Início",
    icon: "home-outline",
    route: "/locais",
  },
  {
    label: "Minha senha",
    icon: "ticket-outline",
    route: "/minha-senha",
  },
  {
    label: "Histórico",
    icon: "time-outline",
    route: "/historico",
  },
  {
    label: "Perfil",
    icon: "person-outline",
    route: "/perfil",
  },
];

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isInicio =
        tab.route === "/locais" &&
        (pathname === "/locais" || pathname.startsWith("/locais/") || pathname === "/servicos");

        const isActive =
        isInicio ||
        pathname === tab.route ||
        pathname.startsWith(`${tab.route}/`);

        return (
          <Pressable
            key={tab.route}
            style={styles.tab}
            onPress={() => router.push(tab.route as never)}
          >
            <Ionicons
              name={tab.icon}
              size={24}
              color={isActive ? "#0757D8" : "#777777"}
            />

            <Text
              style={[
                styles.label,
                isActive && styles.activeLabel,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,

    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",

    paddingVertical: 10,

    backgroundColor: "#FFFFFF",

    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },

  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  label: {
    fontSize: 11,
    color: "#777777",
  },

  activeLabel: {
    color: "#0757D8",
    fontWeight: "600",
  },
});