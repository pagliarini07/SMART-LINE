import { Ionicons } from "@expo/vector-icons";
import { supabase } from "./supabase";

const STATUS_FINALIZADOS = ["atendido", "cancelado", "nao_compareceu"];

export type Servico = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  titulo: string;
  descricao: string;
  setor: string;
  pessoasAguardando: number;
};

export type UnidadeServicos = {
  id: string;
  nome: string;
  endereco: string;
  aberto: boolean;
  pessoasAguardando: number;
};

export type DadosServicosLocal = {
  unidade: UnidadeServicos;
  servicos: Servico[];
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

  const [horaAbertura, minutoAbertura] = abertura.split(":").map(Number);
  const [horaFechamento, minutoFechamento] = fechamento.split(":").map(Number);

  const inicio = horaAbertura * 60 + minutoAbertura;
  const fim = horaFechamento * 60 + minutoFechamento;

  return minutosAgora >= inicio && minutosAgora <= fim;
}

export async function listarServicosPorLocal(
  localId: string
): Promise<DadosServicosLocal> {
  const { data: local, error: localError } = await supabase
    .from("locais")
    .select(
      "id, nome, endereco, horario_abertura, horario_fechamento, ativo"
    )
    .eq("id", localId)
    .eq("ativo", true)
    .maybeSingle();

  if (localError) {
    throw localError;
  }

  if (!local) {
    throw new Error("Local não encontrado.");
  }

  const { data: servicos, error: servicosError } = await supabase
    .from("servicos")
    .select(
      "id, titulo, descricao, setor, icone, cor_icone, cor_fundo"
    )
    .eq("local_id", localId)
    .eq("ativo", true)
    .order("titulo");

  if (servicosError) {
    throw servicosError;
  }

  const servicosAtivos = servicos ?? [];
  const ids = servicosAtivos.map((servico) => servico.id);
  const contagem = new Map<string, number>();

  if (ids.length > 0) {
    const { data: senhas, error: senhasError } = await supabase
      .from("senhas")
      .select("servico_id")
      .in("servico_id", ids)
      .not("status", "in", `(${STATUS_FINALIZADOS.join(",")})`);

    if (senhasError) {
      throw senhasError;
    }

    for (const senha of senhas ?? []) {
      contagem.set(
        senha.servico_id,
        (contagem.get(senha.servico_id) ?? 0) + 1
      );
    }
  }

  const lista: Servico[] = servicosAtivos.map((servico) => ({
    id: servico.id,
    icon:
      (servico.icone as keyof typeof Ionicons.glyphMap) ??
      "document-text-outline",
    iconColor: servico.cor_icone ?? "#0757D8",
    iconBackground: servico.cor_fundo ?? "#EDF4FF",
    titulo: servico.titulo,
    descricao: servico.descricao ?? "",
    setor: servico.setor ?? "Não informado",
    pessoasAguardando: contagem.get(servico.id) ?? 0,
  }));

  return {
    unidade: {
      id: local.id,
      nome: local.nome,
      endereco: local.endereco,
      aberto: estaAberto(
        local.horario_abertura,
        local.horario_fechamento
      ),
      pessoasAguardando: lista.reduce(
        (total, servico) => total + servico.pessoasAguardando,
        0
      ),
    },
    servicos: lista,
  };
}
