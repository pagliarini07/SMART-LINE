import { supabase } from "./supabase";

// Status que já saíram da fila — qualquer outro valor de "status" conta
// como senha ainda ativa/aguardando (não fixamos o nome exato do estado
// "aguardando" aqui, só excluímos os que já terminaram).
const STATUS_FINALIZADOS = ["atendido", "cancelado", "nao_compareceu"];

export type SenhaAtiva = {
  id: string;
  codigo: string;
  servico: string;
  local: string;
  posicao: number;
  tempoEstimadoMinutos: number;
};

type SenhaComServico = {
  id: string;
  servico_id: string;
  status: string;
  retirada_em: string;
};

/**
 * Busca a senha ativa (ainda não finalizada) mais recente do usuário.
 * Retorna null se o usuário não tiver nenhuma senha em aberto.
 */
export async function getSenhaAtiva(
  userId: string
): Promise<SenhaAtiva | null> {
  const { data: senha, error } = await supabase
    .from("senhas")
    .select("id, servico_id, status, retirada_em")
    .eq("usuario_id", userId)
    .not("status", "in", `(${STATUS_FINALIZADOS.join(",")})`)
    .order("retirada_em", { ascending: false })
    .limit(1)
    .maybeSingle<SenhaComServico>();

  if (error) {
    throw error;
  }

  if (!senha) {
    return null;
  }

  // Dados do serviço/local são buscados à parte (em vez de um embed do
  // PostgREST) pra não depender de a FK servicos.id estar declarada — ver
  // nota no PR sobre verificar/corrigir constraints (issue #40/#41).
  const { data: servico, error: servicoError } = await supabase
    .from("servicos")
    .select("titulo, prefixo_senha, tempo_medio_minutos, local_id")
    .eq("id", senha.servico_id)
    .maybeSingle();

  if (servicoError) {
    throw servicoError;
  }

  let nomeLocal = "";

  if (servico?.local_id) {
    const { data: local, error: localError } = await supabase
      .from("locais")
      .select("nome")
      .eq("id", servico.local_id)
      .maybeSingle();

    if (localError) {
      throw localError;
    }

    nomeLocal = local?.nome ?? "";
  }

  // Posição na fila: quantas senhas do mesmo serviço, ainda não
  // finalizadas, foram retiradas antes (ou no mesmo instante) da nossa.
  const { count, error: countError } = await supabase
    .from("senhas")
    .select("id", { count: "exact", head: true })
    .eq("servico_id", senha.servico_id)
    .not("status", "in", `(${STATUS_FINALIZADOS.join(",")})`)
    .lte("retirada_em", senha.retirada_em);

  if (countError) {
    throw countError;
  }

  const posicao = count && count > 0 ? count : 1;
  const tempoMedio = servico?.tempo_medio_minutos ?? 5;
  const prefixo = servico?.prefixo_senha ?? "";

  return {
    id: senha.id,
    codigo: `${prefixo}${String(posicao).padStart(3, "0")}`,
    servico: servico?.titulo ?? "Serviço",
    local: nomeLocal,
    posicao,
    tempoEstimadoMinutos: posicao * tempoMedio,
  };
}

export type StatusAtendimento =
  | "atendido"
  | "cancelado"
  | "nao_compareceu";

export type AtendimentoHistorico = {
  id: string;
  servico: string;
  local: string;
  data: string;
  hora: string;
  status: StatusAtendimento;
};

type SenhaHistoricoRow = {
  id: string;
  servico_id: string;
  status: StatusAtendimento;
  retirada_em: string;
  atendido_em: string | null;
  finalizado_em: string | null;
};

export async function getHistoricoSenhas(
  userId: string
): Promise<AtendimentoHistorico[]> {
  const { data: senhas, error } = await supabase
    .from("senhas")
    .select(
      "id, servico_id, status, retirada_em, atendido_em, finalizado_em"
    )
    .eq("usuario_id", userId)
    .in("status", STATUS_FINALIZADOS)
    .order("retirada_em", { ascending: false });

  if (error) {
    throw error;
  }

  if (!senhas || senhas.length === 0) {
    return [];
  }

  const linhas = senhas as SenhaHistoricoRow[];

  const servicoIds = [
    ...new Set(
      linhas.map((senha) => senha.servico_id)
    ),
  ];

  const {
    data: servicos,
    error: servicosError,
  } = await supabase
    .from("servicos")
    .select("id, titulo, local_id")
    .in("id", servicoIds);

  if (servicosError) {
    throw servicosError;
  }

  const localIds = [
    ...new Set(
      (servicos ?? [])
        .map((servico) => servico.local_id)
        .filter(
          (id): id is string => Boolean(id)
        )
    ),
  ];

  let locais: {
    id: string;
    nome: string;
  }[] = [];

  if (localIds.length > 0) {
    const {
      data,
      error: locaisError,
    } = await supabase
      .from("locais")
      .select("id, nome")
      .in("id", localIds);

    if (locaisError) {
      throw locaisError;
    }

    locais = data ?? [];
  }

  const servicosPorId = new Map(
    (servicos ?? []).map((servico) => [
      servico.id,
      servico,
    ])
  );

  const locaisPorId = new Map(
    locais.map((local) => [
      local.id,
      local.nome,
    ])
  );

  return linhas.map((senha) => {
    const servico = servicosPorId.get(
      senha.servico_id
    );

    const dataHora = new Date(
      senha.finalizado_em ??
        senha.atendido_em ??
        senha.retirada_em
    );

    return {
      id: senha.id,
      servico:
        servico?.titulo ?? "Serviço",
      local:
        (servico?.local_id &&
          locaisPorId.get(
            servico.local_id
          )) ||
        "Local não informado",
      data: dataHora.toLocaleDateString(
        "pt-BR"
      ),
      hora: dataHora.toLocaleTimeString(
        "pt-BR",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
      status: senha.status,
    };
  });
}
