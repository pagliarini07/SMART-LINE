import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import {
  calcularPercentual,
  formatarPontos,
  RESUMO_NIVEL,
} from "../../lib/niveis";
import { getProfile, saveProfile } from "../../lib/profiles";

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

function apenasDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

function formatarCpf(cpf: string) {
  const digitos = apenasDigitos(cpf);

  if (digitos.length !== 11) {
    return cpf;
  }

  return digitos.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    "$1.$2.$3-$4"
  );
}

const progressoNivel = calcularPercentual(
  RESUMO_NIVEL.pontosNivelAtual,
  RESUMO_NIVEL.pontosProximoNivel
);

export default function Perfil() {
  const { user, signOut } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");

  useEffect(() => {
    async function carregarPerfil() {
      if (!user) {
        setCarregando(false);
        return;
      }

      try {
        const perfil = await getProfile(user.id);

        setNome(perfil?.nome ?? "");
        setEmail(perfil?.email ?? user.email ?? "");
        setCpf(perfil?.cpf ?? "");
      } catch {
        setErro("Não foi possível carregar seus dados agora.");
        setEmail(user.email ?? "");
      } finally {
        setCarregando(false);
      }
    }

    carregarPerfil();
  }, [user]);

  const handleSalvar = async () => {
    if (!user) {
      return;
    }

    setErro("");

    if (!nome.trim()) {
      setErro("Digite seu nome.");
      return;
    }

    if (!email.includes("@")) {
      setErro("Digite um e-mail válido.");
      return;
    }

    if (cpf && apenasDigitos(cpf).length !== 11) {
      setErro("Digite um CPF válido (11 dígitos).");
      return;
    }

    setSalvando(true);

    try {
      await saveProfile(user.id, {
        nome: nome.trim(),
        email: email.trim(),
        cpf: apenasDigitos(cpf),
      });
      setEditando(false);
    } catch {
      setErro("Não foi possível salvar seus dados agora.");
    } finally {
      setSalvando(false);
    }
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

          {carregando ? (
            <ActivityIndicator
              style={styles.loading}
              color={COLORS.blue}
            />
          ) : !editando ? (
            <>
              <Text style={styles.nome}>{nome || "Sem nome cadastrado"}</Text>
              <Text style={styles.email}>{email}</Text>
              {cpf ? (
                <Text style={styles.email}>CPF: {formatarCpf(cpf)}</Text>
              ) : null}

              <Pressable
                style={styles.editButton}
                onPress={() => {
                  setErro("");
                  setEditando(true);
                }}
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

              <Text style={styles.label}>CPF</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu CPF"
                keyboardType="numeric"
                maxLength={11}
                value={cpf}
                onChangeText={(valor) => setCpf(apenasDigitos(valor))}
              />

              {erro ? <Text style={styles.errorText}>{erro}</Text> : null}

              <Pressable
                style={[styles.saveButton, salvando && styles.saveButtonDisabled]}
                onPress={handleSalvar}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar</Text>
                )}
              </Pressable>
            </View>
          )}

          {erro && !editando ? (
            <Text style={styles.errorText}>{erro}</Text>
          ) : null}
        </View>

        {/* NÍVEL / PROGRESSO */}
        <View style={styles.levelCard}>
          <View style={styles.levelIconWrap}>
            <Ionicons name="trophy" size={20} color={COLORS.yellow} />
          </View>

          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>
              Nível {RESUMO_NIVEL.nivelAtual} • {RESUMO_NIVEL.nomeNivel}
            </Text>
            <Text style={styles.levelSubtitle}>
              Faltam{" "}
              {formatarPontos(
                RESUMO_NIVEL.pontosProximoNivel - RESUMO_NIVEL.pontosNivelAtual
              )}{" "}
              pontos para o nível {RESUMO_NIVEL.nivelAtual + 1}
            </Text>

            <View style={styles.levelProgressTrack}>
              <View
                style={[
                  styles.levelProgressFill,
                  { width: `${progressoNivel}%` },
                ]}
              />
            </View>

            <View style={styles.levelFooterRow}>
              <Text style={styles.levelProgressText}>
                {formatarPontos(RESUMO_NIVEL.pontosNivelAtual)} /{" "}
                {formatarPontos(RESUMO_NIVEL.pontosProximoNivel)} pts
              </Text>

              <Pressable onPress={() => router.push("/conquistas")}>
                <Text style={styles.levelLink}>Ver conquistas</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* SAIR */}
        <Pressable style={styles.logoutButton} onPress={handleSair}>
          <Ionicons name="log-out-outline" size={18} color="#D32F2F" />
          <Text style={styles.logoutButtonText}>Sair</Text>
        </Pressable>
      </View>

      {/* BARRA INFERIOR */}
      <View style={styles.tabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => router.push("/locais")}
        >
          <Ionicons
            name="home-outline"
            size={22}
            color={COLORS.secondary}
          />
          <Text style={styles.tabLabel}>Início</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => router.push("/minha-senha")}
        >
          <Ionicons
            name="ticket-outline"
            size={22}
            color={COLORS.secondary}
          />
          <Text style={styles.tabLabel}>Minha senha</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => router.push("/historico")}
        >
          <Ionicons name="time-outline" size={22} color={COLORS.secondary} />
          <Text style={styles.tabLabel}>Histórico</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => router.push("/conquistas")}
        >
          <Ionicons
            name="trophy-outline"
            size={22}
            color={COLORS.secondary}
          />
          <Text style={styles.tabLabel}>Conquistas</Text>
        </Pressable>

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

  loading: {
    marginTop: 16,
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

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },

  errorText: {
    color: "#D32F2F",
    fontSize: 12.5,
    marginBottom: 12,
    alignSelf: "flex-start",
  },

  levelCard: {
    marginTop: 14,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8EDF7",
    padding: 14,
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
    marginRight: 12,
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
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E9EEF7",
    overflow: "hidden",
  },

  levelProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.blue,
  },

  levelFooterRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  levelProgressText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "600",
  },

  levelLink: {
    color: COLORS.blue,
    fontSize: 12,
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
