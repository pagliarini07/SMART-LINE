import { supabase } from "./supabase";

export type Avaliacao = {
  id: string;
  usuario_id: string;
  local_id: string;
  nota: number;
  created_at: string;
  updated_at: string;
};

export type RankingLocal = {
  local_id: string;
  nome: string;
  media_nota: number | null;
  total_avaliacoes: number;
};

export const RANKING_POR_PAGINA = 15;

export type PaginaRanking = {
  itens: RankingLocal[];
  temMais: boolean;
};

/**
 * Busca a avaliação do usuário logado para um determinado local.
 */
export async function buscarMinhaAvaliacao(
  localId: string
): Promise<Avaliacao | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data, error } = await supabase
    .from("avaliacoes")
    .select("*")
    .eq("usuario_id", user.id)
    .eq("local_id", localId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Cria uma nova avaliação para um local.
 */
export async function criarAvaliacao(
  localId: string,
  nota: number
): Promise<Avaliacao> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data, error } = await supabase
    .from("avaliacoes")
    .insert({
      usuario_id: user.id,
      local_id: localId,
      nota,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Edita a avaliação do usuário para um local.
 */
export async function editarAvaliacao(
  avaliacaoId: string,
  nota: number
): Promise<Avaliacao> {
  const { data, error } = await supabase
    .from("avaliacoes")
    .update({
      nota,
      updated_at: new Date().toISOString(),
    })
    .eq("id", avaliacaoId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Busca todas as avaliações feitas pelo usuário logado.
 */
export async function buscarMinhasAvaliacoes(): Promise<Avaliacao[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data, error } = await supabase
    .from("avaliacoes")
    .select("*")
    .eq("usuario_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Busca uma página do ranking geral dos locais, ordenado por média de
 * nota (issue #114). `pagina` começa em 0. Pede um registro a mais que
 * o tamanho da página só pra saber se ainda existe uma próxima, sem
 * precisar de uma consulta de count separada (mesmo padrão de
 * getHistoricoSenhas em services/senhas.ts).
 *
 * A função do banco retorna apenas dados agregados: nome, média das
 * notas e quantidade de avaliações. Nenhuma informação sobre quem
 * avaliou é retornada.
 */
export async function buscarRanking(
  pagina = 0,
  tamanho = RANKING_POR_PAGINA
): Promise<PaginaRanking> {
  const inicio = pagina * tamanho;

  const { data, error } = await supabase.rpc(
    "buscar_ranking_locais_paginado",
    {
      p_limit: tamanho + 1,
      p_offset: inicio,
    }
  );

  if (error) {
    throw error;
  }

  const linhas = data ?? [];
  const temMais = linhas.length > tamanho;

  return {
    itens: linhas.slice(0, tamanho),
    temMais,
  };
}