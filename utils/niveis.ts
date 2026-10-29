export function calcularPercentual(atual: number, necessario: number) {
  return Math.min((atual / necessario) * 100, 100);
}

export function formatarPontos(valor: number) {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}
