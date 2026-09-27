export type ResumoNivel = {
  nivelAtual: number;
  nomeNivel: string;
  pontosNivelAtual: number;
  pontosProximoNivel: number;
};

// Dados mocados de evolução do usuário — trocar por dados reais (pontos
// ganhos por ações concluídas no app) quando essa integração existir no
// backend. Compartilhado entre a tela de Conquistas e o resumo no Perfil,
// pra não ter duas fontes de verdade pro nível do usuário.
export const RESUMO_NIVEL: ResumoNivel = {
  nivelAtual: 6,
  nomeNivel: "Cidadão Ativo",
  pontosNivelAtual: 1450,
  pontosProximoNivel: 2000,
};

export function calcularPercentual(atual: number, necessario: number) {
  return Math.min((atual / necessario) * 100, 100);
}

export function formatarPontos(valor: number) {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}
