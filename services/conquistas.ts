import { supabase } from "./supabase";

export type CategoriaConquista = "locais" | "servicos" | "sequencia";

type CriterioConquista = {
  tipo: string;
  quantidade?: number;
  vezes_por_servico?: number;
};

type ConquistaBanco = {
  id: string;
  nome: string;
  descricao: string;
  categoria: CategoriaConquista;
  criterio: CriterioConquista;
  recompensa_pontos: number;
  ordem: number;
};

type ProgressoBanco = {
  conquista_id: string;
  progresso_atual: number;
  concluida_em: string | null;
};

type PontoBanco = {
  quantidade: number;
};

export type ConquistaUsuario = {
  id: string;
  nome: string;
  descricao: string;
  categoria: CategoriaConquista;
  recompensa: number;
  progressoAtual: number;
  progressoNecessario: number;
  concluida: boolean;
};

export type DadosConquistas = {
  conquistas: ConquistaUsuario[];
  totalConquistas: number;
  conquistasConcluidas: number;
  percentualConcluido: number;
  totalPontos: number;
};

export async function getDadosConquistas(
  userId: string
): Promise<DadosConquistas> {
  // O progresso e as recompensas são calculados no banco.
  const { error: erroRpc } = await supabase.rpc(
    "atualizar_progresso_conquistas"
  );

  if (erroRpc) {
    throw erroRpc;
  }

  const [
    { data: conquistas, error: erroConquistas },
    { data: progressos, error: erroProgressos },
    { data: pontos, error: erroPontos },
    { data: servicos, error: erroServicos },
  ] = await Promise.all([
    supabase
      .from("conquistas")
      .select(
        "id, nome, descricao, categoria, criterio, recompensa_pontos, ordem"
      )
      .eq("ativa", true)
      .order("ordem", { ascending: true }),

    supabase
      .from("progresso_conquistas")
      .select("conquista_id, progresso_atual, concluida_em")
      .eq("usuario_id", userId),

    supabase
      .from("pontos_usuarios")
      .select("quantidade")
      .eq("usuario_id", userId),

    supabase
      .from("servicos")
      .select("id")
      .eq("ativo", true),
  ]);

  if (erroConquistas) throw erroConquistas;
  if (erroProgressos) throw erroProgressos;
  if (erroPontos) throw erroPontos;
  if (erroServicos) throw erroServicos;

  const progressoPorConquista = new Map(
    (progressos ?? []).map((progresso: ProgressoBanco) => [
      progresso.conquista_id,
      progresso,
    ])
  );

  const totalServicos = servicos?.length ?? 0;

  const lista: ConquistaUsuario[] = (
    (conquistas ?? []) as ConquistaBanco[]
  ).map((conquista) => {
    const progresso = progressoPorConquista.get(conquista.id);
    const criterio = conquista.criterio;

    let progressoNecessario = criterio.quantidade ?? 1;

    if (criterio.tipo === "todos_servicos") {
      progressoNecessario = Math.max(totalServicos, 1);
    }

    const progressoAtual = progresso?.progresso_atual ?? 0;

    return {
      id: conquista.id,
      nome: conquista.nome,
      descricao: conquista.descricao,
      categoria: conquista.categoria,
      recompensa: conquista.recompensa_pontos,
      progressoAtual,
      progressoNecessario,
      concluida:
        progresso?.concluida_em != null ||
        progressoAtual >= progressoNecessario,
    };
  });

  const conquistasConcluidas = lista.filter(
    (conquista) => conquista.concluida
  ).length;

  const totalPontos = (pontos ?? []).reduce(
    (total: number, ponto: PontoBanco) => total + ponto.quantidade,
    0
  );

  return {
    conquistas: lista,
    totalConquistas: lista.length,
    conquistasConcluidas,
    percentualConcluido:
      lista.length > 0
        ? Math.round((conquistasConcluidas / lista.length) * 100)
        : 0,
    totalPontos,
  };
}
