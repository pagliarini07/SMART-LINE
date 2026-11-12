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

  it("chama contagem_espera uma vez por serviço (ids únicos) e monta o mapa", async () => {
    mockRpc.mockImplementation(
      (_nome: string, args: { p_servico_id: string }) => {
        const valores: Record<string, number> = {
          "servico-1": 5,
          "servico-2": 0,
        };

        return Promise.resolve({
          data: valores[args.p_servico_id] ?? 0,
          error: null,
        });
      }
    );

    const resultado = await contarEsperaPorServico([
      "servico-1",
      "servico-2",
      // Id repetido -- não deve chamar a RPC de novo pro mesmo serviço.
      "servico-1",
    ]);

    expect(mockRpc).toHaveBeenCalledTimes(2);
    expect(mockRpc).toHaveBeenCalledWith("contagem_espera", {
      p_servico_id: "servico-1",
    });
    expect(resultado.get("servico-1")).toBe(5);
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
