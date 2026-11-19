import { useColorScheme } from "react-native";
import { Cores, CORES_CLARO, CORES_ESCURO } from "../constants/cores";

/**
 * Cores do tema ativo, de acordo com o esquema de cores do sistema
 * (issue #115). Enquanto só algumas telas adotam o tema, as demais
 * continuam com seu `COLORS` fixo em claro.
 */
export function useTema(): Cores {
  const esquema = useColorScheme();

  return esquema === "dark" ? CORES_ESCURO : CORES_CLARO;
}
