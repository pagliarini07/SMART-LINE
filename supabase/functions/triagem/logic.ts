export type CatalogoServico = {
  id: string;
  titulo: string;
  descricao: string;
  setor: string;
  local: string;
  aguardando: number;
  tempo_medio_min: number;
};

export type TriagemResposta = {
  servico_id: string | null;
  confianca: number;
  motivo: string;
  documentos: string[];
  alternativas: string[];
  pergunta_esclarecimento: string | null;
};

export const TRIAGEM_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    servico_id: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    confianca: {
      type: "number",
    },
    motivo: {
      type: "string",
    },
    documentos: {
      type: "array",
      items: { type: "string" },
    },
    alternativas: {
      type: "array",
      items: { type: "string" },
    },
    pergunta_esclarecimento: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
  },
  required: [
    "servico_id",
    "confianca",
    "motivo",
    "documentos",
    "alternativas",
    "pergunta_esclarecimento",
  ],
} as const;

const REGEX_CPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const REGEX_EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const REGEX_TELEFONE =
  /(?:\+?55\s*)?(?:\(?\d{2}\)?[\s.-]*)?(?:9\d{4}|\d{4})[\s.-]*\d{4}\b/g;

export function sanitizarPedido(pedido: string): string {
  return pedido
    .replace(REGEX_EMAIL, "[EMAIL_REMOVIDO]")
    .replace(REGEX_CPF, "[CPF_REMOVIDO]")
    .replace(REGEX_TELEFONE, "[TELEFONE_REMOVIDO]")
    .trim();
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function validarListaTextos(
  valor: unknown,
  campo: string,
  maxItens: number,
  maxCaracteres: number
): string[] {
  if (!Array.isArray(valor) || valor.length > maxItens) {
    throw new Error(`Resposta inválida: ${campo}.`);
  }

  return valor.map((item) => {
    if (typeof item !== "string") {
      throw new Error(`Resposta inválida: ${campo}.`);
    }

    const texto = item.trim();

    if (!texto || texto.length > maxCaracteres) {
      throw new Error(`Resposta inválida: ${campo}.`);
    }

    return texto;
  });
}

export function validarTriagemResposta(
  valor: unknown,
  idsServicosValidos: Set<string>
): TriagemResposta {
  if (!ehObjeto(valor)) {
    throw new Error("Resposta inválida da IA.");
  }

  const servicoId = valor.servico_id;

  if (
    servicoId !== null &&
    (typeof servicoId !== "string" || !idsServicosValidos.has(servicoId))
  ) {
    throw new Error("A IA retornou um serviço inexistente.");
  }

  const confianca = valor.confianca;

  if (
    typeof confianca !== "number" ||
    !Number.isFinite(confianca) ||
    confianca < 0 ||
    confianca > 1
  ) {
    throw new Error("Resposta inválida: confianca.");
  }

  if (typeof valor.motivo !== "string") {
    throw new Error("Resposta inválida: motivo.");
  }

  const motivo = valor.motivo.trim();

  if (!motivo || motivo.length > 300) {
    throw new Error("Resposta inválida: motivo.");
  }

  const documentos = validarListaTextos(
    valor.documentos,
    "documentos",
    5,
    180
  );

  if (!Array.isArray(valor.alternativas) || valor.alternativas.length > 2) {
    throw new Error("Resposta inválida: alternativas.");
  }

  const alternativas: string[] = [];

  for (const alternativa of valor.alternativas) {
    if (
      typeof alternativa !== "string" ||
      !idsServicosValidos.has(alternativa) ||
      alternativa === servicoId ||
      alternativas.includes(alternativa)
    ) {
      throw new Error("A IA retornou uma alternativa inválida.");
    }

    alternativas.push(alternativa);
  }

  const pergunta = valor.pergunta_esclarecimento;
  let perguntaEsclarecimento: string | null = null;

  if (pergunta !== null) {
    if (typeof pergunta !== "string") {
      throw new Error("Resposta inválida: pergunta_esclarecimento.");
    }

    const texto = pergunta.trim();

    if (!texto || texto.length > 220) {
      throw new Error("Resposta inválida: pergunta_esclarecimento.");
    }

    perguntaEsclarecimento = texto;
  }

  return {
    servico_id: servicoId,
    confianca,
    motivo,
    documentos,
    alternativas,
    pergunta_esclarecimento: perguntaEsclarecimento,
  };
}
