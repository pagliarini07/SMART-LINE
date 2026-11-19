jest.mock("./supabase", () => ({
  supabase: { rpc: jest.fn() },
}));

import { supabase } from "./supabase";
import { contarEsperaPorServico } from "./filas";

const mockRpc = supabase.rpc as jest.Mock;

beforeEach(() => {
  mockRpc.mockReset();
});

describe("contarEsperaPorServico", () => {
  it("retorna um mapa vazio sem chamar o banco quando não há ids", async () => {
    const resultado = await contarEsperaPorServico([]);

    expect(resultado.size).toBe(0);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("faz uma única chamada em lote com ids únicos e monta o mapa", async () => {
    mockRpc.mockResolvedValue({
      data: [
        { servico_id: "servico-1", quantidade: 5 },
        { servico_id: "servico-2", quantidade: 0 },
      ],
      error: null,
    });

    const resultado = await contarEsperaPorServico([
      "servico-1",
      "servico-2",
      // Id repetido -- deve ser enviado apenas uma vez.
      "servico-1",
    ]);

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith("contagem_espera_lote", {
      p_servico_ids: ["servico-1", "servico-2"],
    });
    expect(resultado.size).toBe(2);
    expect(resultado.get("servico-1")).toBe(5);
    expect(resultado.get("servico-2")).toBe(0);
  });

  it("mantém zero para serviço sem linha no retorno", async () => {
    mockRpc.mockResolvedValue({
      data: [{ servico_id: "servico-1", quantidade: 3 }],
      error: null,
    });

    const resultado = await contarEsperaPorServico([
      "servico-1",
      "servico-2",
    ]);

    expect(resultado.get("servico-1")).toBe(3);
    expect(resultado.get("servico-2")).toBe(0);
  });

  it("propaga erro da RPC", async () => {
    const erro = { message: "falha no banco" };
    mockRpc.mockResolvedValueOnce({ data: null, error: erro });

    await expect(
      contarEsperaPorServico(["servico-1"])
    ).rejects.toBe(erro);
  });
});
