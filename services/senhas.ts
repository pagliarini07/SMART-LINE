import { supabase } from "./supabase";

// Status que já saíram da fila — qualquer outro valor de "status" conta
// como senha ainda ativa/aguardando (não fixamos o nome exato do estado
// "aguardando" aqui, só excluímos os que já terminaram).
const STATUS_FINALIZADOS = ["atendido", "cancelado", "nao_compareceu"];

export type SenhaAtiva = {
  id: string;
  servicoId: string;
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
    servicoId: senha.servico_id,
    codigo: `${prefixo}${String(posicao).padStart(3, "0")}`,
    servico: servico?.titulo ?? "Serviço",
    local: nomeLocal,
    posicao,
    tempoEstimadoMinutos: posicao * tempoMedio,
  };
}

/**
 * Retira uma senha real para o serviço informado.
 *
 * Se o usuário já estiver na fila desse mesmo serviço, reaproveita
 * a senha existente em vez de criar outra.
 */
export async function retirarSenha(
  userId: string,
  servicoId: string
): Promise<SenhaAtiva> {
  const senhaAtual = await getSenhaAtiva(userId);

  if (senhaAtual) {
    if (senhaAtual.servicoId === servicoId) {
      return senhaAtual;
    }

    throw new Error("Você já possui uma senha ativa em outro serviço.");
  }

  const { error } = await supabase.rpc("entrar_na_fila", {
    p_servico_id: servicoId,
  });

  if (error) {
    // Se duas chamadas acontecerem quase ao mesmo tempo, a outra pode
    // ter criado a senha antes. Nesse caso, reaproveitamos a senha.
    const senhaAposErro = await getSenhaAtiva(userId).catch(() => null);

    if (senhaAposErro?.servicoId === servicoId) {
      return senhaAposErro;
    }

    throw error;
  }

  const novaSenha = await getSenhaAtiva(userId);

  if (!novaSenha || novaSenha.servicoId !== servicoId) {
    throw new Error("Não foi possível carregar a senha retirada.");
  }

  return novaSenha;
}

/**
 * Cancela ("Sair da fila") a senha em aberto do usuário logado, via a
 * função cancelar_senha do banco (status -> "cancelado").
 *
 * Se a senha já tiver saído da fila por outro motivo (ex.: foi atendida
 * enquanto a tela estava aberta), não trata como erro: o resultado pro
 * usuário é o mesmo — ele não está mais na fila.
 */
export async function cancelarSenha(senhaId: string): Promise<void> {
  const { error } = await supabase.rpc("cancelar_senha", {
    p_senha_id: senhaId,
  });

  if (error && error.code !== "P0002") {
    throw error;
  }
}

/**
 * Mensagem amigável pra falha ao sair da fila (rede fora, banco fora etc.).
 */
export function mensagemErroCancelamento(error: unknown): string {
  // Erros do supabase-js nem sempre são instâncias de Error, mas sempre
  // têm "message".
  const mensagem = String(
    (error as { message?: unknown } | null)?.message ?? ""
  ).toLowerCase();

  if (mensagem.includes("failed to fetch") || mensagem.includes("network")) {
    return "Sem conexão com o servidor. Verifique sua internet e tente sair da fila novamente.";
  }

  return "Não foi possível sair da fila agora. Tente novamente.";
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

export const HISTORICO_POR_PAGINA = 15;

export type PaginaHistorico = {
  itens: AtendimentoHistorico[];
  temMais: boolean;
};

/**
 * Busca uma página do histórico do usuário (mais recentes primeiro).
 * `pagina` começa em 0. Pede um registro a mais que o tamanho da página
 * só pra saber se ainda existe uma próxima, sem precisar de count.
 */
export async function getHistoricoSenhas(
  userId: string,
  pagina = 0,
  tamanho = HISTORICO_POR_PAGINA
): Promise<PaginaHistorico> {
  const inicio = pagina * tamanho;

  const { data: senhas, error } = await supabase
    .from("senhas")
    .select(
      "id, servico_id, status, retirada_em, atendido_em, finalizado_em"
    )
    .eq("usuario_id", userId)
    .in("status", STATUS_FINALIZADOS)
    .order("retirada_em", { ascending: false })
    // Desempate estável: sem isso, senhas com o mesmo retirada_em
    // poderiam pular ou repetir entre uma página e outra.
    .order("id", { ascending: false })
    .range(inicio, inicio + tamanho);

  if (error) {
    throw error;
  }

  if (!senhas || senhas.length === 0) {
    return { itens: [], temMais: false };
  }

  const temMais = senhas.length > tamanho;
  const linhas = senhas.slice(0, tamanho) as SenhaHistoricoRow[];

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

  const itens = linhas.map((senha) => {
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

  return { itens, temMais };
}
