import { supabase } from "./supabase";
import type { TriagemResposta } from "./triagem";

const STATUS_FINALIZADOS = ["atendido", "cancelado", "nao_compareceu"];

// A partir desse valor de confiança, o app afirma "é esse o serviço".
// Abaixo disso, mostra esclarecimento/alternativas em vez de afirmar.
// Mesmo limite citado na issue (0.6) e na "Modelagem da IA" do time.
export const LIMIAR_CONFIANCA = 0.6;

export type AlternativaRecomendacao = {
  servicoId: string;
  titulo: string;
  nomeLocal: string;
};

export type Recomendacao = {
  servicoId: string;
  titulo: string;
  nomeLocal: string;
  pessoasAguardando: number;
  confianca: number;
  motivo: string;
  documentosSugeridos: string[];
  alternativas: AlternativaRecomendacao[];
};

type ServicoRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  setor: string | null;
  documentos_sugeridos: string[] | null;
  local_id: string;
};

const PALAVRAS_IGNORADAS = new Set([
  "de", "da", "do", "das", "dos", "a", "o", "as", "os", "um", "uma",
  "para", "pra", "preciso", "quero", "gostaria", "meu", "minha", "meus",
  "minhas", "no", "na", "em", "com", "e", "ou", "por", "que", "tirar",
  "fazer", "como", "ja", "vou", "ir", "ao",
]);

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function extrairPalavrasChave(pedido: string): string[] {
  return normalizar(pedido)
    .split(/[^a-z0-9]+/)
    .filter(
      // >= 2 pra não perder siglas curtas e importantes (RG, CNH, CPF
      // já têm 3, mas "RG" sozinho tem só 2).
      (palavra) => palavra.length >= 2 && !PALAVRAS_IGNORADAS.has(palavra)
    );
}

// Tokeniza o texto de um serviço em um conjunto de palavras inteiras, pra
// comparar palavra-por-palavra em vez de substring — evita falso positivo
// tipo "rg" "achando" a palavra "órgão" (que contém "rg" no meio).
function tokenizar(texto: string): Set<string> {
  return new Set(
    normalizar(texto)
      .split(/[^a-z0-9]+/)
      .filter((palavra) => palavra.length > 0)
  );
}

function documentosPadrao(setor: string | null): string[] {
  const texto = normalizar(setor ?? "");

  if (texto.includes("identific")) {
    return ["RG ou CNH", "CPF", "Comprovante de residência"];
  }

  if (texto.includes("tribut")) {
    return [
      "CPF ou CNPJ",
      "Comprovante de residência",
      "Guia ou carnê do tributo",
    ];
  }

  if (texto.includes("social") || texto.includes("idoso")) {
    return ["RG", "CPF", "Comprovante de residência"];
  }

  if (texto.includes("protocolo")) {
    return ["Documento de identificação", "Requerimento preenchido"];
  }

  return ["Documento de identificação com foto", "Comprovante de residência"];
}

async function contarAguardandoPorServico(
  servicoIds: string[]
): Promise<Map<string, number>> {
  const contagem = new Map<string, number>();

  if (servicoIds.length === 0) {
    return contagem;
  }

  const { data: senhas, error } = await supabase
    .from("senhas")
    .select("servico_id")
    .in("servico_id", servicoIds)
    .not("status", "in", `(${STATUS_FINALIZADOS.join(",")})`);

  if (error) {
    throw error;
  }

  for (const senha of senhas ?? []) {
    contagem.set(senha.servico_id, (contagem.get(senha.servico_id) ?? 0) + 1);
  }

  return contagem;
}

/**
 * Recomendador por similaridade de texto. **Não é uma chamada a um LLM** —
 * o projeto ainda não tem uma chave de IA configurada. Compara as
 * palavras-chave do pedido do usuário com título/descrição/setor dos
 * serviços reais cadastrados no Supabase e calcula uma "confiança" (0 a 1)
 * proporcional a quantas palavras-chave bateram.
 *
 * Documentado assim de propósito: trocar por uma chamada de modelo de
 * verdade no futuro só exige reescrever o corpo desta função, mantendo o
 * mesmo contrato de retorno (Recomendacao | null) — nada na tela precisa
 * mudar.
 *
 * Retorna null quando nenhuma palavra-chave do pedido bate com nenhum
 * serviço (pedido vazio/confuso demais pra sequer arriscar um palpite).
 */
export async function recomendarServico(
  pedido: string
): Promise<Recomendacao | null> {
  const palavrasChave = extrairPalavrasChave(pedido);

  if (palavrasChave.length === 0) {
    return null;
  }

  const { data: servicos, error } = await supabase
    .from("servicos")
    .select("id, titulo, descricao, setor, documentos_sugeridos, local_id")
    .eq("ativo", true);

  if (error) {
    throw error;
  }

  const servicosAtivos = (servicos ?? []) as ServicoRow[];

  if (servicosAtivos.length === 0) {
    return null;
  }

  const localIds = [
    ...new Set(servicosAtivos.map((servico) => servico.local_id)),
  ];

  const { data: locaisData, error: locaisError } = await supabase
    .from("locais")
    .select("id, nome")
    .in("id", localIds);

  if (locaisError) {
    throw locaisError;
  }

  const nomesPorLocal = new Map(
    (locaisData ?? []).map((local) => [local.id, local.nome as string])
  );

  const pontuados = servicosAtivos
    .map((servico) => {
      const palavrasServico = tokenizar(
        `${servico.titulo} ${servico.descricao ?? ""} ${servico.setor ?? ""}`
      );

      const palavrasCasadas = palavrasChave.filter((palavra) =>
        palavrasServico.has(palavra)
      );

      return {
        servico,
        palavrasCasadas,
        confianca: palavrasCasadas.length / palavrasChave.length,
      };
    })
    .sort((a, b) => b.confianca - a.confianca);

  const melhor = pontuados[0];

  if (!melhor || melhor.confianca === 0) {
    return null;
  }

  const idsParaContagem = pontuados.slice(0, 4).map((item) => item.servico.id);
  const contagem = await contarAguardandoPorServico(idsParaContagem);

  const alternativas: AlternativaRecomendacao[] = pontuados
    .slice(1, 4)
    .filter((item) => item.confianca > 0)
    .map((item) => ({
      servicoId: item.servico.id,
      titulo: item.servico.titulo,
      nomeLocal: nomesPorLocal.get(item.servico.local_id) ?? "",
    }));

  const motivo =
    melhor.palavrasCasadas.length > 0
      ? `"${melhor.palavrasCasadas[0]}" tem relação com este serviço.`
      : "Esse serviço parece atender ao que você descreveu.";

  return {
    servicoId: melhor.servico.id,
    titulo: melhor.servico.titulo,
    nomeLocal: nomesPorLocal.get(melhor.servico.local_id) ?? "",
    pessoasAguardando: contagem.get(melhor.servico.id) ?? 0,
    confianca: melhor.confianca,
    motivo,
    documentosSugeridos:
      melhor.servico.documentos_sugeridos &&
      melhor.servico.documentos_sugeridos.length > 0
        ? melhor.servico.documentos_sugeridos
        : documentosPadrao(melhor.servico.setor),
    alternativas,
  };
}

/**
 * Monta o card de recomendação a partir da resposta da IA (Edge Function
 * "triagem", issue #69). A IA só devolve ids; título, local e fila vêm do
 * banco, então o card mostra sempre os dados reais do Supabase.
 *
 * Retorna null se o serviço indicado não existir mais (ou estiver
 * inativo) — a tela trata como "sem resultado".
 */
export async function montarRecomendacaoDaTriagem(
  resposta: TriagemResposta
): Promise<Recomendacao | null> {
  if (!resposta.servico_id) {
    return null;
  }

  const ids = [resposta.servico_id, ...resposta.alternativas];

  const { data: servicos, error } = await supabase
    .from("servicos")
    .select("id, titulo, descricao, setor, documentos_sugeridos, local_id")
    .in("id", ids)
    .eq("ativo", true);

  if (error) {
    throw error;
  }

  const servicosPorId = new Map(
    ((servicos ?? []) as ServicoRow[]).map((servico) => [servico.id, servico])
  );

  const principal = servicosPorId.get(resposta.servico_id);

  if (!principal) {
    return null;
  }

  const localIds = [
    ...new Set([...servicosPorId.values()].map((servico) => servico.local_id)),
  ];

  const { data: locaisData, error: locaisError } = await supabase
    .from("locais")
    .select("id, nome")
    .in("id", localIds);

  if (locaisError) {
    throw locaisError;
  }

  const nomesPorLocal = new Map(
    (locaisData ?? []).map((local) => [local.id, local.nome as string])
  );

  const contagem = await contarAguardandoPorServico([principal.id]);

  const alternativas: AlternativaRecomendacao[] = resposta.alternativas
    .map((id) => servicosPorId.get(id))
    .filter((servico): servico is ServicoRow => Boolean(servico))
    .map((servico) => ({
      servicoId: servico.id,
      titulo: servico.titulo,
      nomeLocal: nomesPorLocal.get(servico.local_id) ?? "",
    }));

  // Documentos: os da IA primeiro; se ela não sugerir nenhum, os
  // cadastrados no serviço; por último, a lista padrão do setor.
  const documentosSugeridos =
    resposta.documentos.length > 0
      ? resposta.documentos
      : principal.documentos_sugeridos &&
          principal.documentos_sugeridos.length > 0
        ? principal.documentos_sugeridos
        : documentosPadrao(principal.setor);

  return {
    servicoId: principal.id,
    titulo: principal.titulo,
    nomeLocal: nomesPorLocal.get(principal.local_id) ?? "",
    pessoasAguardando: contagem.get(principal.id) ?? 0,
    confianca: resposta.confianca,
    motivo: resposta.motivo,
    documentosSugeridos,
    alternativas,
  };
}
