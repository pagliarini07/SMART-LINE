import { supabase } from "./supabase";

type ContagemEsperaLote = {
  servico_id: string;
  quantidade: number;
};

/**
 * Consulta em lote quantas senhas ainda estão aguardando por serviço.
 * A RPC agrega os dados no banco (SECURITY DEFINER), respeitando o RLS
 * sem expor linhas individuais de senhas.
 */
export async function contarEsperaPorServico(
  servicoIds: string[]
): Promise<Map<string, number>> {
  const idsUnicos = [...new Set(servicoIds)];
  const contagem = new Map<string, number>();

  if (idsUnicos.length === 0) {
    return contagem;
  }

  const { data, error } = await supabase.rpc("contagem_espera_lote", {
    p_servico_ids: idsUnicos,
  });

  if (error) {
    throw error;
  }

  // A RPC retorna uma linha por serviço, inclusive quando a fila está vazia.
  for (const servicoId of idsUnicos) {
    contagem.set(servicoId, 0);
  }

  for (const resultado of (data ?? []) as ContagemEsperaLote[]) {
    contagem.set(resultado.servico_id, resultado.quantidade);
  }

  return contagem;
}
