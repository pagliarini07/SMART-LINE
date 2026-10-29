import { supabase } from "./supabase";

export type NivelCadastrado = {
  nivel: number;
  nome: string;
  pontos_minimos: number;
};

export type ResumoNivelUsuario = {
  totalPontos: number;
  nivelAtual: NivelCadastrado | null;
  proximoNivel: NivelCadastrado | null;
  progresso: number;
  pontosFaltantes: number;
  niveisConfigurados: boolean;
};

type PontoUsuario = {
  quantidade: number;
};

export async function getResumoNivelUsuario(
  userId: string,
): Promise<ResumoNivelUsuario> {
  const [resultadoPontos, resultadoNiveis] = await Promise.all([
    supabase
      .from("pontos_usuarios")
      .select("quantidade")
      .eq("usuario_id", userId),
    supabase
      .from("niveis")
      .select("nivel, nome, pontos_minimos")
      .order("pontos_minimos", { ascending: true }),
  ]);

  if (resultadoPontos.error) throw resultadoPontos.error;
  if (resultadoNiveis.error) throw resultadoNiveis.error;

  const totalPontos = ((resultadoPontos.data ?? []) as PontoUsuario[]).reduce(
    (total, ponto) => total + ponto.quantidade,
    0,
  );

  const niveis = (resultadoNiveis.data ?? []) as NivelCadastrado[];

  if (niveis.length === 0) {
    return {
      totalPontos,
      nivelAtual: null,
      proximoNivel: null,
      progresso: 0,
      pontosFaltantes: 0,
      niveisConfigurados: false,
    };
  }

  let indiceNivelAtual = -1;

  for (let i = 0; i < niveis.length; i += 1) {
    if (totalPontos >= niveis[i].pontos_minimos) {
      indiceNivelAtual = i;
    } else {
      break;
    }
  }

  // Se o usuário ainda não alcançou o primeiro nível cadastrado,
  // não atribuímos um nível artificialmente.
  if (indiceNivelAtual === -1) {
    const primeiroNivel = niveis[0];
    const pontosNecessarios = primeiroNivel.pontos_minimos;

    return {
      totalPontos,
      nivelAtual: null,
      proximoNivel: primeiroNivel,
      progresso:
        pontosNecessarios > 0
          ? Math.min((totalPontos / pontosNecessarios) * 100, 100)
          : 100,
      pontosFaltantes: Math.max(pontosNecessarios - totalPontos, 0),
      niveisConfigurados: true,
    };
  }

  const nivelAtual = niveis[indiceNivelAtual];
  const proximoNivel = niveis[indiceNivelAtual + 1] ?? null;

  if (!proximoNivel) {
    return {
      totalPontos,
      nivelAtual,
      proximoNivel: null,
      progresso: 100,
      pontosFaltantes: 0,
      niveisConfigurados: true,
    };
  }

  const intervalo = proximoNivel.pontos_minimos - nivelAtual.pontos_minimos;
  const pontosDentroNivel = totalPontos - nivelAtual.pontos_minimos;

  return {
    totalPontos,
    nivelAtual,
    proximoNivel,
    progresso:
      intervalo > 0
        ? Math.min(Math.max((pontosDentroNivel / intervalo) * 100, 0), 100)
        : 100,
    pontosFaltantes: Math.max(proximoNivel.pontos_minimos - totalPontos, 0),
    niveisConfigurados: true,
  };
}
