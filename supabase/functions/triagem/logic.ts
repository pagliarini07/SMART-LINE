export type CatalogoServico = {
  id: string;
  titulo: string;
  descricao: string;
  setor: string;
  local: string;
  aguardando: number;
  tempo_medio_min: number;
  documentos_sugeridos: string[];
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

// Remove autodeclarações explícitas antes de o texto sair do SmartLine.
// A função não consulta nome, e-mail, CPF ou histórico do usuário no banco.
const REGEX_NOME_EXPLICITO =
  /\b(?:meu nome\s+(?:é|e)|me chamo|chamo-me|nome\s*:)\s+(.+?)(?=\s+(?:e\s+)?(?:preciso|quero|gostaria|necessito|vim|vou)\b|[,.;\n]|$)/giu;

export function sanitizarPedido(pedido: string): string {
  return pedido
    .replace(REGEX_EMAIL, "[EMAIL_REMOVIDO]")
    .replace(REGEX_CPF, "[CPF_REMOVIDO]")
    .replace(REGEX_TELEFONE, "[TELEFONE_REMOVIDO]")
    .replace(REGEX_NOME_EXPLICITO, "[NOME_REMOVIDO]")
    .trim();
}

const MAX_ALTERNATIVAS = 2;
const MAX_MOTIVO = 300;
const MAX_PERGUNTA = 220;

/** Texto longo demais é cortado (com "…") em vez de recusar a resposta. */
function limitarTexto(texto: string, maximo: number): string {
  return texto.length <= maximo ? texto : `${texto.slice(0, maximo - 1).trimEnd()}…`;
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

  const servicoRecebido = valor.servico_id;

  if (servicoRecebido !== null && typeof servicoRecebido !== "string") {
    throw new Error("Resposta inválida: servico_id.");
  }

  const confiancaRecebida = valor.confianca;

  if (
    typeof confiancaRecebida !== "number" ||
    !Number.isFinite(confiancaRecebida) ||
    confiancaRecebida < 0 ||
    confiancaRecebida > 1
  ) {
    throw new Error("Resposta inválida: confianca.");
  }

  // Serviço fora do catálogo = a IA inventou. Em vez de derrubar a triagem
  // (erro pro usuário), a escolha é descartada e a confiança zerada; a
  // política de confiança transforma isso em pergunta de esclarecimento.
  const servicoInventado =
    servicoRecebido !== null && !idsServicosValidos.has(servicoRecebido);

  const servicoId = servicoInventado ? null : servicoRecebido;
  const confianca = servicoInventado ? 0 : confiancaRecebida;

  if (typeof valor.motivo !== "string") {
    throw new Error("Resposta inválida: motivo.");
  }

  const motivo = valor.motivo.trim();

  if (!motivo) {
    throw new Error("Resposta inválida: motivo.");
  }

  // A função usa os documentos do catálogo, não os da IA; se ela mandar
  // mais de 5, só cortamos em vez de recusar a resposta inteira.
  const documentos = validarListaTextos(
    Array.isArray(valor.documentos)
      ? valor.documentos.slice(0, 5)
      : valor.documentos,
    "documentos",
    5,
    180
  );

  // Com o mesmo serviço em vários locais (IPTU em 3 unidades do Resolve,
  // Cadastro Único em 7 CRAS) a IA às vezes manda mais de 2 alternativas.
  // Antes isso derrubava a triagem inteira (502); agora ficam só as 2
  // primeiras válidas (issue #95).
  if (!Array.isArray(valor.alternativas)) {
    throw new Error("Resposta inválida: alternativas.");
  }

  const alternativas: string[] = [];

  for (const alternativa of valor.alternativas) {
    if (typeof alternativa !== "string") {
      throw new Error("Resposta inválida: alternativas.");
    }

    // Alternativa inventada, repetida ou igual à principal: só é ignorada.
    if (
      !idsServicosValidos.has(alternativa) ||
      alternativa === servicoId ||
      alternativas.includes(alternativa)
    ) {
      continue;
    }

    if (alternativas.length < MAX_ALTERNATIVAS) {
      alternativas.push(alternativa);
    }
  }

  const pergunta = valor.pergunta_esclarecimento;
  let perguntaEsclarecimento: string | null = null;

  if (pergunta !== null) {
    if (typeof pergunta !== "string") {
      throw new Error("Resposta inválida: pergunta_esclarecimento.");
    }

    // Pergunta vazia conta como "sem pergunta"; a política de confiança
    // coloca uma pergunta padrão se precisar.
    const texto = pergunta.trim();
    perguntaEsclarecimento = texto ? limitarTexto(texto, MAX_PERGUNTA) : null;
  }

  return {
    servico_id: servicoId,
    confianca,
    motivo: limitarTexto(motivo, MAX_MOTIVO),
    documentos,
    alternativas,
    pergunta_esclarecimento: perguntaEsclarecimento,
  };
}

// ---------------------------------------------------------------------------
// Confiança mínima (issue #96): a IA não deve "chutar".
// ---------------------------------------------------------------------------

/**
 * Abaixo disso a recomendação não é tratada como certeza: o app mostra o
 * serviço junto das alternativas ("Não tenho certeza — qual dessas?").
 * Mesmo valor de LIMIAR_CONFIANCA em services/recomendacao.ts.
 */
export const CONFIANCA_MINIMA = 0.6;

/**
 * Abaixo disso o serviço escolhido é descartado e o cidadão recebe só uma
 * pergunta de esclarecimento. Ex.: "Preciso resolver um documento".
 */
export const CONFIANCA_DESCARTE = 0.35;

export const PERGUNTA_PADRAO_AMBIGUO =
  "Pode dar mais detalhes? Por exemplo, qual documento ou serviço você precisa e se é emissão, renovação ou segunda via.";

export const PERGUNTA_PADRAO_SEM_SERVICO =
  "Não encontrei esse serviço no SmartLine. Pode descrever de outro jeito, dizendo qual documento ou órgão você procura?";

/**
 * Aplica as regras de confiança depois da validação:
 * - confiança muito baixa: descarta o serviço e pede esclarecimento;
 * - sem serviço: sempre devolve uma pergunta (nunca resposta vazia);
 * - confiança alta: não manda pergunta junto, pra não confundir a tela.
 */
export function aplicarPoliticaConfianca(
  resposta: TriagemResposta
): TriagemResposta {
  if (resposta.servico_id !== null && resposta.confianca < CONFIANCA_DESCARTE) {
    return {
      ...resposta,
      servico_id: null,
      documentos: [],
      alternativas: [],
      pergunta_esclarecimento:
        resposta.pergunta_esclarecimento ?? PERGUNTA_PADRAO_AMBIGUO,
    };
  }

  if (resposta.servico_id === null) {
    return {
      ...resposta,
      documentos: [],
      alternativas: [],
      pergunta_esclarecimento:
        resposta.pergunta_esclarecimento ??
        (resposta.confianca > 0
          ? PERGUNTA_PADRAO_AMBIGUO
          : PERGUNTA_PADRAO_SEM_SERVICO),
    };
  }

  if (resposta.confianca >= CONFIANCA_MINIMA) {
    return { ...resposta, pergunta_esclarecimento: null };
  }

  return resposta;
}

// ---------------------------------------------------------------------------
// Leitura da resposta do Gemini e tratamento de falhas.
// ---------------------------------------------------------------------------

/**
 * Pega o texto da resposta do Gemini, ignorando blocos de "pensamento".
 */
export function extrairTextoGemini(payload: unknown): string {
  const candidatos = ehObjeto(payload) ? payload.candidates : null;
  const primeiro = Array.isArray(candidatos) ? candidatos[0] : null;
  const conteudo = ehObjeto(primeiro) ? primeiro.content : null;
  const partes = ehObjeto(conteudo) ? conteudo.parts : null;

  if (Array.isArray(partes)) {
    for (const parte of partes) {
      if (
        ehObjeto(parte) &&
        typeof parte.text === "string" &&
        parte.thought !== true &&
        parte.text.trim()
      ) {
        return parte.text;
      }
    }
  }

  throw new Error("A IA não retornou texto.");
}

/**
 * Converte o texto da IA em objeto. Aceita o JSON cercado por ```json, que
 * alguns modelos devolvem mesmo quando pedimos JSON puro.
 */
export function extrairJsonDaIA(texto: string): unknown {
  const limpo = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(limpo);
  } catch {
    throw new Error("A IA retornou JSON inválido.");
  }
}

/** Erro HTTP devolvido pela API do Gemini (cota, fora do ar, etc.). */
export class ErroProvedorIA extends Error {
  status: number;

  constructor(status: number) {
    super(`Erro do provedor de IA (${status}).`);
    this.name = "ErroProvedorIA";
    this.status = status;
  }
}

/**
 * Traduz uma falha da IA para a resposta HTTP da função. O app usa o status
 * pra escolher a mensagem: 503 = IA indisponível (cota esgotada ou Gemini
 * fora do ar), 504 = demorou demais, 502 = resposta que não deu pra usar.
 */
export function respostaDeFalhaDaIA(erro: unknown): {
  status: number;
  mensagem: string;
} {
  // No Deno o abort do fetch é um DOMException; checamos só o nome.
  if (ehObjeto(erro) && erro.name === "AbortError") {
    return { status: 504, mensagem: "A IA demorou demais para responder." };
  }

  if (
    erro instanceof ErroProvedorIA &&
    (erro.status === 429 || erro.status >= 500)
  ) {
    return {
      status: 503,
      mensagem: "O serviço de IA está indisponível no momento.",
    };
  }

  return {
    status: 502,
    mensagem: "Não foi possível realizar a triagem agora.",
  };
}
