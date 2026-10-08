import { Ionicons } from "@expo/vector-icons";
import { supabase } from "./supabase";

// Senhas que já saíram da fila — qualquer outro status conta como "ainda
// aguardando" (mesmo critério usado em lib/senhas.ts).
const STATUS_FINALIZADOS = ["atendido", "cancelado", "nao_compareceu"];

export type Categoria = {
  id: string;
  nome: string;
  icone: keyof typeof Ionicons.glyphMap;
};

export type Local = {
  id: string;
  categoriaId: string | null;
  nome: string;
  endereco: string;
  distancia: string | null;
  aberto: boolean;
  pessoasAguardando: number;
  icone: keyof typeof Ionicons.glyphMap;
  corIcone: string;
  corFundo: string;
};

function estaAberto(
  abertura: string | null,
  fechamento: string | null
): boolean {
  if (!abertura || !fechamento) {
    return true;
  }

  const agora = new Date();
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

  const [horaAbertura, minAbertura] = abertura.split(":").map(Number);
  const [horaFechamento, minFechamento] = fechamento.split(":").map(Number);

  const minutosAbertura = horaAbertura * 60 + minAbertura;
  const minutosFechamento = horaFechamento * 60 + minFechamento;

  return minutosAgora >= minutosAbertura && minutosAgora <= minutosFechamento;
}

/**
 * Busca as categorias de local cadastradas no Supabase. Se a consulta
 * falhar (ou a tabela estiver vazia), retorna [] e a tela de Locais
 * simplesmente não mostra filtros por categoria — não quebra a lista.
 */
export async function listarCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase.from("categorias").select("*");

  if (error) {
    console.error("Erro ao buscar categorias:", error);
    return [];
  }

  return (data ?? []).map((categoria: Record<string, unknown>) => ({
    id: String(categoria.id),
    nome: String(categoria.nome ?? categoria.titulo ?? "Categoria"),
    icone: (categoria.icone as keyof typeof Ionicons.glyphMap) ?? "apps-outline",
  }));
}

/**
 * Busca os locais ativos no Supabase, já com "aberto agora" calculado a
 * partir do horário de funcionamento e "pessoas aguardando" somado a
 * partir das senhas em aberto dos serviços de cada local.
 *
 * Feito com consultas separadas (locais / servicos / senhas) em vez de
 * embeds relacionais do PostgREST, pra não depender de as FKs entre essas
 * tabelas estarem declaradas no banco (ver issues #40/#41).
 */
export async function listarLocais(): Promise<Local[]> {
  const { data: locais, error: locaisError } = await supabase
    .from("locais")
    .select(
      "id, categoria_id, nome, endereco, distancia, horario_abertura, horario_fechamento, icone, cor_icone, cor_fundo, ativo"
    )
    .eq("ativo", true)
    .order("nome");

  if (locaisError) {
    throw locaisError;
  }

  const locaisAtivos = locais ?? [];

  if (locaisAtivos.length === 0) {
    return [];
  }

  const idsLocais = locaisAtivos.map((local) => local.id);

  const { data: servicos, error: servicosError } = await supabase
    .from("servicos")
    .select("id, local_id")
    .in("local_id", idsLocais);

  if (servicosError) {
    throw servicosError;
  }

  const servicoIdsPorLocal = new Map<string, string[]>();

  for (const servico of servicos ?? []) {
    const lista = servicoIdsPorLocal.get(servico.local_id) ?? [];
    lista.push(servico.id);
    servicoIdsPorLocal.set(servico.local_id, lista);
  }

  const todosServicoIds = (servicos ?? []).map((s) => s.id);

  const contagemPorServico = new Map<string, number>();

  if (todosServicoIds.length > 0) {
    const { data: senhas, error: senhasError } = await supabase
      .from("senhas")
      .select("servico_id")
      .in("servico_id", todosServicoIds)
      .not("status", "in", `(${STATUS_FINALIZADOS.join(",")})`);

    if (senhasError) {
      throw senhasError;
    }

    for (const senha of senhas ?? []) {
      contagemPorServico.set(
        senha.servico_id,
        (contagemPorServico.get(senha.servico_id) ?? 0) + 1
      );
    }
  }

  return locaisAtivos.map((local) => {
    const servicoIds = servicoIdsPorLocal.get(local.id) ?? [];
    const pessoasAguardando = servicoIds.reduce(
      (soma, id) => soma + (contagemPorServico.get(id) ?? 0),
      0
    );

    return {
      id: local.id,
      categoriaId: local.categoria_id,
      nome: local.nome,
      endereco: local.endereco,
      distancia: local.distancia,
      aberto: estaAberto(local.horario_abertura, local.horario_fechamento),
      pessoasAguardando,
      icone: (local.icone as keyof typeof Ionicons.glyphMap) ?? "grid-outline",
      corIcone: local.cor_icone ?? "#0757D8",
      corFundo: local.cor_fundo ?? "#EDF4FF",
    };
  });
}
