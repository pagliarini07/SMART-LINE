import { supabase } from "./supabase";

type StatusSequencia =
  | "atendido"
  | "cancelado"
  | "nao_compareceu";

type SenhaSequencia = {
  id: string;
  status: StatusSequencia;
  retirada_em: string;
};

export type DadosSequencia = {
  atual: number;
  recorde: number;
  totalResponsaveis: number;
};

function calcularSequencia(
  senhas: SenhaSequencia[]
): DadosSequencia {
  let sequencia = 0;
  let recorde = 0;
  let totalResponsaveis = 0;

  for (const senha of senhas) {
    if (
      senha.status === "atendido" ||
      senha.status === "cancelado"
    ) {
      sequencia += 1;
      totalResponsaveis += 1;

      if (sequencia > recorde) {
        recorde = sequencia;
      }
    }

    if (senha.status === "nao_compareceu") {
      sequencia = 0;
    }
  }

  return {
    atual: sequencia,
    recorde,
    totalResponsaveis,
  };
}

export async function getSequenciaAtendimentos(
  userId: string
): Promise<DadosSequencia> {
  const { data, error } = await supabase
    .from("senhas")
    .select("id, status, retirada_em")
    .eq("usuario_id", userId)
    .in("status", [
      "atendido",
      "cancelado",
      "nao_compareceu",
    ])
    .order("retirada_em", { ascending: true });

  if (error) {
    throw error;
  }

  return calcularSequencia(
    (data ?? []) as SenhaSequencia[]
  );
}
