import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const COLORS = {
  red: "#D32F2F",
  redSoft: "#FDECEC",
  redBorder: "#F2B8B8",
  text: "#0D1E46",
  secondary: "#65708A",
  white: "#FFFFFF",
  border: "#DCE4F1",
};

type Props = {
  mensagem: string;
  textoConfirmar: string;
  textoCancelar: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  carregando?: boolean;
};

/**
 * Pede confirmação dentro da própria tela antes de uma ação difícil de
 * desfazer (sair da fila, sair da conta). Usado no lugar do Alert nativo,
 * que não funciona com botões na versão web.
 */
export default function ConfirmacaoInline({
  mensagem,
  textoConfirmar,
  textoCancelar,
  onConfirmar,
  onCancelar,
  carregando = false,
}: Props) {
  return (
    <View style={styles.box} accessibilityRole="alert">
      <View style={styles.messageRow}>
        <Ionicons name="alert-circle-outline" size={18} color={COLORS.red} />
        <Text style={styles.message}>{mensagem}</Text>
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={onCancelar}
          disabled={carregando}
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>{textoCancelar}</Text>
        </Pressable>

        <Pressable
          style={[
            styles.button,
            styles.confirmButton,
            carregando && styles.disabled,
          ]}
          onPress={onConfirmar}
          disabled={carregando}
          accessibilityRole="button"
        >
          {carregando ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.confirmText}>{textoConfirmar}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: "100%",
    backgroundColor: COLORS.redSoft,
    borderWidth: 1,
    borderColor: COLORS.redBorder,
    borderRadius: 14,
    padding: 14,
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  message: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 8,
  },

  buttons: {
    flexDirection: "row",
    marginTop: 12,
  },

  button: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },

  confirmButton: {
    backgroundColor: COLORS.red,
  },

  disabled: {
    opacity: 0.7,
  },

  cancelText: {
    color: COLORS.text,
    fontSize: 13.5,
    fontWeight: "700",
  },

  confirmText: {
    color: COLORS.white,
    fontSize: 13.5,
    fontWeight: "700",
  },
});
