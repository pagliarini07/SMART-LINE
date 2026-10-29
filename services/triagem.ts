import {
  FunctionsFetchError,
  FunctionsHttpError,
} from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Limite do pedido digitado no Assistente de IA (tela Locais).
export const LIMITE_PEDIDO = 300;

// A IA pode demorar; depois disso desistimos e avisamos o usuário.
const TIMEOUT_MS = 25000;

// Mesmo formato da resposta da Edge Function "triagem" (issue #69,
// supabase/functions/triagem/logic.ts > TriagemResposta).
export type TriagemResposta = {
  servico_id: string | null;
  confianca: number;
  motivo: string;
  documentos: string[];
  alternativas: string[];
  pergunta_esclarecimento: string | null;
};

export type TipoErroTriagem =
  | "pedido_vazio"
  | "sem_internet"
  | "timeout"
  | "nao_autenticado"
  | "erro_ia"
  | "resposta_invalida";

export class ErroTriagem extends Error {
  tipo: TipoErroTriagem;

  constructor(tipo: TipoErroTriagem, mensagem: string) {
    super(mensagem);
    this.name = "ErroTriagem";
    this.tipo = tipo;
  }
}

function ehListaDeTextos(valor: unknown): valor is string[] {
  return (
    Array.isArray(valor) && valor.every((item) => typeof item === "string")
  );
}

/**
 * Confere o formato da resposta antes de a tela usar. A Edge Function já
 * valida a resposta da IA, mas o app não confia cegamente: qualquer coisa
 * fora do contrato vira erro "resposta_invalida" em vez de quebrar a tela.
 */
export function validarRespostaTriagem(valor: unknown): TriagemResposta {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) {
    throw new ErroTriagem("resposta_invalida", "Resposta da triagem inválida.");
  }

  const dados = valor as Record<string, unknown>;

  const servicoIdValido =
    dados.servico_id === null || typeof dados.servico_id === "string";
  const confiancaValida =
    typeof dados.confianca === "number" &&
    Number.isFinite(dados.confianca) &&
    dados.confianca >= 0 &&
    dados.confianca <= 1;
  const perguntaValida =
    dados.pergunta_esclarecimento === null ||
    typeof dados.pergunta_esclarecimento === "string";

  if (
    !servicoIdValido ||
    !confiancaValida ||
    typeof dados.motivo !== "string" ||
    !ehListaDeTextos(dados.documentos) ||
    !ehListaDeTextos(dados.alternativas) ||
    !perguntaValida
  ) {
    throw new ErroTriagem("resposta_invalida", "Resposta da triagem inválida.");
  }

  // Sem serviço e sem pergunta, não há nada útil pra mostrar.
  if (dados.servico_id === null && !dados.pergunta_esclarecimento) {
    throw new ErroTriagem("resposta_invalida", "Resposta da triagem vazia.");
  }

  return {
    servico_id: dados.servico_id as string | null,
    confianca: dados.confianca as number,
    motivo: dados.motivo as string,
    documentos: dados.documentos as string[],
    alternativas: dados.alternativas as string[],
    pergunta_esclarecimento: dados.pergunta_esclarecimento as string | null,
  };
}

/**
 * Envia o pedido em linguagem natural pra Edge Function "triagem", que
 * consulta a IA no backend (a chave da IA nunca fica no app). O usuário
 * precisa estar logado — o supabase-js manda o token da sessão sozinho.
 */
export async function triarPedido(pedido: string): Promise<TriagemResposta> {
  const texto = pedido.trim().slice(0, LIMITE_PEDIDO);

  if (!texto) {
    throw new ErroTriagem("pedido_vazio", "Descreva o que você precisa.");
  }

  const { data, error } = await supabase.functions.invoke("triagem", {
    body: { pedido: texto },
    timeout: TIMEOUT_MS,
  });

  if (error) {
    if (error instanceof FunctionsFetchError) {
      // O timeout do supabase-js aborta o fetch, que chega aqui como
      // FunctionsFetchError com um AbortError dentro.
      const causa = (error as { context?: { name?: string } }).context;

      if (causa?.name === "AbortError") {
        throw new ErroTriagem("timeout", "A triagem demorou demais.");
      }

      throw new ErroTriagem("sem_internet", "Sem conexão com o servidor.");
    }

    if (error instanceof FunctionsHttpError) {
      const resposta = error.context as Response | undefined;

      // Registra o motivo devolvido pela função (ajuda a depurar a #69
      // sem mostrar detalhe técnico pro usuário).
      const detalhe = await resposta?.text?.().catch(() => "");
      console.warn(
        `[triagem] Edge Function respondeu ${resposta?.status}:`,
        detalhe
      );

      if (resposta?.status === 401) {
        throw new ErroTriagem("nao_autenticado", "Sessão expirada.");
      }
    }

    // FunctionsHttpError (erro dentro da função/IA) ou FunctionsRelayError.
    throw new ErroTriagem("erro_ia", "A triagem falhou.");
  }

  return validarRespostaTriagem(data);
}

/**
 * Texto amigável pra cada tipo de falha, exibido abaixo do campo.
 */
export function mensagemErroTriagem(error: unknown): string {
  const tipo = error instanceof ErroTriagem ? error.tipo : "erro_ia";

  switch (tipo) {
    case "pedido_vazio":
      return "Descreva o que você precisa antes de perguntar.";
    case "sem_internet":
      return "Sem conexão com o servidor. Verifique sua internet e tente de novo.";
    case "timeout":
      return "A análise demorou mais que o esperado. Tente de novo em instantes.";
    case "nao_autenticado":
      return "Sua sessão expirou. Entre novamente para usar o assistente.";
    case "resposta_invalida":
      return "Não conseguimos entender a resposta do assistente. Tente descrever de outro jeito ou escolha na lista abaixo.";
    default:
      return "O assistente não conseguiu responder agora. Você pode tentar de novo ou escolher na lista abaixo.";
  }
}
