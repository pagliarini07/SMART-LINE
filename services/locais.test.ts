jest.mock("./supabase", () => ({
  supabase: { from: jest.fn() },
}));

jest.mock("./filas", () => ({
  contarEsperaPorServico: jest.fn(),
}));

import { contarEsperaPorServico } from "./filas";
import { listarLocais } from "./locais";
import { supabase } from "./supabase";

type ResultadoMock = {
  data?: unknown;
  error?: unknown;
};

function queryBuilder(resultado: ResultadoMock) {
  const builder: Record<string, unknown> = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    order: jest.fn(() => builder),
    maybeSingle: jest.fn(() => Promise.resolve(resultado)),
    then: (resolve: (valor: ResultadoMock) => unknown) =>
      Promise.resolve(resultado).then(resolve),
  };

  return builder;
}

const mockFrom = supabase.from as jest.Mock;
const mockContarEspera = contarEsperaPorServico as jest.Mock;

beforeEach(() => {
  mockFrom.mockReset();
  mockContarEspera.mockReset();
});

describe("listarLocais", () => {
  it("retorna os locais ativos com a quantidade de pessoas aguardando", async () => {
    mockFrom
      .mockReturnValueOnce(
        queryBuilder({
          data: [
            {
              id: "local-1",
              categoria_id: "categoria-1",
              nome: "Resolve Palmas",
              endereco: "Centro",
              latitude: -10.18,
              longitude: -48.33,
              horario_abertura: null,
              horario_fechamento: null,
              icone: null,
              cor_icone: null,
              cor_fundo: null,
              ativo: true,
            },
          ],
          error: null,
        })
      )
      .mockReturnValueOnce(
        queryBuilder({
          data: [
            { id: "servico-1", local_id: "local-1" },
            { id: "servico-2", local_id: "local-1" },
          ],
          error: null,
        })
      );

    mockContarEspera.mockResolvedValue(
      new Map([
        ["servico-1", 3],
        ["servico-2", 2],
      ])
    );

    const resultado = await listarLocais();

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      id: "local-1",
      categoriaId: "categoria-1",
      nome: "Resolve Palmas",
      endereco: "Centro",
      pessoasAguardando: 5,
      aberto: true,
      icone: "grid-outline",
      corIcone: "#0757D8",
      corFundo: "#EDF4FF",
    });

    expect(mockContarEspera).toHaveBeenCalledWith([
      "servico-1",
      "servico-2",
    ]);
  });

  it("propaga erro quando a consulta de locais falha", async () => {
    const erro = new Error("falha ao buscar locais");

    mockFrom.mockReturnValueOnce(
      queryBuilder({
        data: null,
        error: erro,
      })
    );

    await expect(listarLocais()).rejects.toThrow(
      "falha ao buscar locais"
    );

    expect(mockContarEspera).not.toHaveBeenCalled();
  });
});
