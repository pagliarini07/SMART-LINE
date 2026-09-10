import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Pressable,
  SafeAreaView,
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
  borderBlue: "#CFE0FF",
};

// Dados mocados do usuário logado — trocar por dados reais (API / estado
// global) quando a autenticação (T11) existir.
const USUARIO_MOCK = {
  nome: "Maria Silva",
  email: "maria.silva@email.com",
};

export default function Perfil() {
  const { signOut } = useAuth();

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(USUARIO_MOCK.nome);
  const [email, setEmail] = useState(USUARIO_MOCK.email);

  const handleSalvar = () => {
    setEditando(false);
  };

  const handleSair = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Erro ao encerrar sessão:", error);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <View style={styles.content}>
        {/* CARD DO USUÁRIO */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={COLORS.blue} />
          </View>

          {!editando ? (
            <>
              <Text style={styles.nome}>{nome}</Text>
              <Text style={styles.email}>{email}</Text>

              <Pressable
                style={styles.editButton}
                onPress={() => setEditando(true)}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={COLORS.blue}
                />
                <Text style={styles.editButtonText}>Editar dados</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu nome"
                value={nome}
                onChangeText={setNome}
              />

              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu e-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Pressable style={styles.saveButton} onPress={handleSalvar}>
                <Text style={styles.saveButtonText}>Salvar</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* SAIR */}
        <Pressable style={styles.logoutButton} onPress={handleSair}>
          <Ionicons name="log-out-outline" size={18} color="#D32F2F" />
          <Text style={styles.logoutButtonText}>Sair</Text>
        </Pressable>
      </View>

      {/* BARRA INFERIOR */}
      <View style={styles.tabBar}>
        <View style={styles.tabItem}>
          <Ionicons name="home-outline" size={22} color={COLORS.secondary} />
          <Text style={styles.tabLabel}>Início</Text>
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
          <Ionicons name="person" size={22} color={COLORS.blue} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Perfil</Text>
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
    flex: 1,
    paddingHorizontal: 16,
  },

  avatarCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",

    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  nome: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "700",
    marginTop: 12,
  },

  email: {
    color: COLORS.secondary,
    fontSize: 13,
    marginTop: 3,
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 16,
  },

  editButtonText: {
    color: COLORS.blue,
    fontSize: 12.5,
    fontWeight: "700",
    marginLeft: 6,
  },

  form: {
    width: "100%",
    marginTop: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
    alignSelf: "flex-start",
  },

  input: {
    width: "100%",
    height: 46,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: "#D9E0EA",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    fontSize: 15,
  },

  saveButton: {
    height: 46,
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E7A3A3",
    marginTop: 20,
  },

  logoutButtonText: {
    color: "#D32F2F",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
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
