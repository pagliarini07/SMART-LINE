// Paleta de cores compartilhada entre os temas claro e escuro (issue #115).
// Cada tela que adotar o tema usa `useTema()` (hooks/useTema.ts) em vez de
// declarar seu próprio `const COLORS = {...}` fixo.
export type Cores = {
  blue: string;
  yellow: string;
  background: string;
  white: string;
  text: string;
  secondary: string;
  border: string;
};

export const CORES_CLARO: Cores = {
  blue: "#0757D8",
  yellow: "#FFC400",
  background: "#F7F9FC",
  white: "#FFFFFF",
  text: "#0D1E46",
  secondary: "#65708A",
  border: "#E8EDF7",
};

export const CORES_ESCURO: Cores = {
  blue: "#5B9BFF",
  yellow: "#FFC400",
  background: "#0B1220",
  white: "#182236",
  text: "#F2F5FC",
  secondary: "#9AA7C2",
  border: "#2A3650",
};
