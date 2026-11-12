import { supabase } from "./supabase";

/**
 * Pra cada id de serviço, consulta quantas senhas ainda estão
 * aguardando via a RPC contagem_espera (issue #93) — agregada dentro
 * do banco (SECURITY DEFINER), então funciona mesmo com o RLS de
 * `senhas` restringindo cada usuário às próprias linhas. Antes, cada
 * tela/serviço contava direto na tabela `senhas`, o que só enxergava a
 * senha do próprio usuário logado e dava números errados pra qualquer
 * outro serviço/local.
 */
export async function contarEsperaPorServico(
  servicoIds: string[]
): Promise<Map<string, number>> {
  const idsUnicos = [...new Set(servicoIds)];
  const contagem = new Map<string, number>();

  if (idsUnicos.length === 0) {
    return contagem;
  }

  const resultados = await Promise.all(
    idsUnicos.map(async (servicoId) => {
      const { data, error } = await supabase.rpc("contagem_espera", {
        p_servico_id: servicoId,
      });

      if (error) {
        throw error;
      }

      return [servicoId, data ?? 0] as const;
    })
  );

  for (const [servicoId, total] of resultados) {
    contagem.set(servicoId, total);
  }

  return contagem;
}
