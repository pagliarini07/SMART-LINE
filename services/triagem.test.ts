jest.mock("./supabase", () => ({
  supabase: { functions: { invoke: jest.fn() } },
}));

import {
  FunctionsFetchError,
  FunctionsHttpError,
} from "@supabase/supabase-js";
import { supabase } from "./supabase";
import {
  ErroTriagem,
  LIMITE_PEDIDO,
  mensagemErroTriagem,
  triarPedido,
  validarRespostaTriagem,
} from "./triagem";

const mockInvoke = supabase.functions.invoke as jest.Mock;

const respostaValida = {
  servico_id: "servico-1",
  confianca: 0.93,
  motivo: "Este serviço atende emissão de segunda via de documentos.",
  documentos: ["RG antigo", "Certidão de nascimento"],
  alternativas: ["servico-2"],
  pergunta_esclarecimento: null,
};

async function tipoDoErro(promessa: Promise<unknown>) {
  try {
    await promessa;
  } catch (error) {
    return (error as ErroTriagem).tipo;
  }

  throw new Error("era esperado um erro");
}

beforeEach(() => {
  mockInvoke.mockReset();
});

describe("triarPedido", () => {
  it("envia o pedido pra Edge Function triagem e devolve a resposta", async () => {
    mockInvoke.mockResolvedValueOnce({ data: respostaValida, error: null });

    const resposta = await triarPedido("  preciso da segunda via do RG  ");

    expect(mockInvoke).toHaveBeenCalledWith(
      "triagem",
      expect.objectContaining({
        body: { pedido: "preciso da segunda via do RG" },
      })
    );
    expect(resposta).toEqual(respostaValida);
  });

  it("não envia pedido vazio", async () => {
    expect(await tipoDoErro(triarPedido("   "))).toBe("pedido_vazio");
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("corta o pedido no limite de caracteres", async () => {
    mockInvoke.mockResolvedValueOnce({ data: respostaValida, error: null });

    await triarPedido("a".repeat(LIMITE_PEDIDO + 50));

    const { body } = mockInvoke.mock.calls[0][1];
    expect(body.pedido).toHaveLength(LIMITE_PEDIDO);
  });

  it("identifica falta de internet", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new FunctionsFetchError(new TypeError("Failed to fetch")),
    });

    expect(await tipoDoErro(triarPedido("RG"))).toBe("sem_internet");
  });

  it("identifica timeout", async () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new FunctionsFetchError(abort),
    });

    expect(await tipoDoErro(triarPedido("RG"))).toBe("timeout");
  });

  it("identifica erro da IA (erro HTTP da função)", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new FunctionsHttpError({ status: 502 }),
    });

    expect(await tipoDoErro(triarPedido("RG"))).toBe("erro_ia");
  });

  it("identifica sessão expirada (401)", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new FunctionsHttpError({ status: 401 }),
    });

    expect(await tipoDoErro(triarPedido("RG"))).toBe("nao_autenticado");
  });

  it("rejeita resposta fora do formato", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { ...respostaValida, confianca: "alta" },
      error: null,
    });

    expect(await tipoDoErro(triarPedido("RG"))).toBe("resposta_invalida");
  });
});

describe("validarRespostaTriagem", () => {
  it("aceita resposta de esclarecimento (sem serviço, com pergunta)", () => {
    const resposta = validarRespostaTriagem({
      ...respostaValida,
      servico_id: null,
      confianca: 0.3,
      alternativas: [],
      pergunta_esclarecimento: "É a primeira via ou a segunda via?",
    });

    expect(resposta.servico_id).toBeNull();
  });

  it("rejeita resposta sem serviço e sem pergunta", () => {
    expect(() =>
      validarRespostaTriagem({
        ...respostaValida,
        servico_id: null,
        pergunta_esclarecimento: null,
      })
    ).toThrow(ErroTriagem);
  });

  it("rejeita confiança fora de 0 a 1", () => {
    expect(() =>
      validarRespostaTriagem({ ...respostaValida, confianca: 1.5 })
    ).toThrow(ErroTriagem);
  });
});

describe("mensagemErroTriagem", () => {
  it("tem mensagem própria pra cada tipo de falha", () => {
    const tipos = [
      "sem_internet",
      "timeout",
      "erro_ia",
      "resposta_invalida",
    ] as const;

    const mensagens = tipos.map((tipo) =>
      mensagemErroTriagem(new ErroTriagem(tipo, ""))
    );

    expect(new Set(mensagens).size).toBe(tipos.length);
  });
});
