import { Ionicons } from "@expo/vector-icons";
import { supabase } from "./supabase";

export type LocalLista = {
  id: string;
  nome: string;
  endereco: string;
  distancia: string;
  pessoasAguardando: number;
  tipo: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  aberto: boolean;
};

export type ServicoLista = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  titulo: string;
  descricao: string;
  setor: string;
  pessoasAguardando: number;
};

export type UnidadeLista = {
  id: string;
  nome: string;
  endereco: string;
  aberto: boolean;
  pessoasAguardando: number;
  icone: keyof typeof Ionicons.glyphMap;
};

function isAberto(
  abertura: string | null,
  fechamento: string | null
): boolean {
  if (!abertura || !fechamento) {
    return true;
  }

  const agora = new Date();
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Araguaina",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(agora);
  return partes >= abertura.slice(0, 5) && partes <= fechamento.slice(0, 5);
}

export async function fetchLocais(): Promise<LocalLista[]> {
  const { data, error } = await supabase
    .from("locais")
    .select(
      "id, nome, endereco, distancia, icone, cor_icone, cor_fundo, horario_abertura, horario_fechamento, categorias ( slug )"
    )
    .eq("ativo", true);

  if (error) {
    throw error;
  }

  const locais = data ?? [];
  const ids = locais.map((local) => local.id);

  const esperaPorLocal = new Map<string, number>();
  if (ids.length > 0) {
    const { data: servicos } = await supabase
      .from("servicos")
      .select("id, local_id")
      .in("local_id", ids)
      .eq("ativo", true);

    const { data: espera } = await supabase.rpc("contagem_espera");
    const esperaPorServico = new Map(
      (espera ?? []).map((item: { servico_id: string; total: number }) => [
        item.servico_id,
        item.total,
      ])
    );

    for (const servico of servicos ?? []) {
      const total = esperaPorServico.get(servico.id) ?? 0;
      if (!total) {
        continue;
      }
      esperaPorLocal.set(
        servico.local_id,
        (esperaPorLocal.get(servico.local_id) ?? 0) + total
      );
    }
  }

  return locais.map((local) => {
    const categoria = local.categorias as { slug: string } | { slug: string }[] | null;
    const slug = Array.isArray(categoria)
      ? categoria[0]?.slug
      : categoria?.slug;

    return {
      id: local.id,
      nome: local.nome,
      endereco: local.endereco,
      distancia: local.distancia || "",
      pessoasAguardando: esperaPorLocal.get(local.id) ?? 0,
      tipo: slug || "servicos",
      icon: (local.icone || "grid-outline") as keyof typeof Ionicons.glyphMap,
      iconColor: local.cor_icone || "#0757D8",
      iconBackground: local.cor_fundo || "#EDF4FF",
      aberto: isAberto(local.horario_abertura, local.horario_fechamento),
    };
  });
}

export async function fetchLocalEServicos(localId: string): Promise<{
  unidade: UnidadeLista;
  servicos: ServicoLista[];
} | null> {
  const { data: local, error: localError } = await supabase
    .from("locais")
    .select(
      "id, nome, endereco, icone, horario_abertura, horario_fechamento"
    )
    .eq("id", localId)
    .eq("ativo", true)
    .maybeSingle();

  if (localError) {
    throw localError;
  }

  if (!local) {
    return null;
  }

  const { data: servicos, error: servicosError } = await supabase
    .from("servicos")
    .select(
      "id, titulo, descricao, setor, icone, cor_icone, cor_fundo"
    )
    .eq("local_id", localId)
    .eq("ativo", true);

  if (servicosError) {
    throw servicosError;
  }

  const { data: espera } = await supabase.rpc("contagem_espera");
  const esperaPorServico = new Map(
    (espera ?? []).map((item: { servico_id: string; total: number }) => [
      item.servico_id,
      item.total,
    ])
  );

  const lista: ServicoLista[] = (servicos ?? []).map((servico) => ({
    id: servico.id,
    icon: (servico.icone || "document-text-outline") as keyof typeof Ionicons.glyphMap,
    iconColor: servico.cor_icone || "#0757D8",
    iconBackground: servico.cor_fundo || "#EDF4FF",
    titulo: servico.titulo,
    descricao: servico.descricao || "",
    setor: servico.setor || "",
    pessoasAguardando: esperaPorServico.get(servico.id) ?? 0,
  }));

  const totalEspera = lista.reduce(
    (soma, servico) => soma + servico.pessoasAguardando,
    0
  );

  return {
    unidade: {
      id: local.id,
      nome: local.nome,
      endereco: local.endereco,
      aberto: isAberto(local.horario_abertura, local.horario_fechamento),
      pessoasAguardando: totalEspera,
      icone: (local.icone || "grid-outline") as keyof typeof Ionicons.glyphMap,
    },
    servicos: lista,
  };
}
