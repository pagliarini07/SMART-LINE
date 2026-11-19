jest.mock("./supabase", () => ({
  supabase: { from: jest.fn() },
}));

jest.mock("./filas", () => ({
  contarEsperaPorServico: jest.fn(),
}));

import { contarEsperaPorServico } from "./filas";
import { listarServicosPorLocal } from "./servicos";
import { supabase } from "./supabase";

type ResultadoMock = {
  data?: unknown;
  error?: unknown;
};

function queryBuilder(resultado: ResultadoMock) {
  const builder: Record<string, unknown> = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
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

describe("listarServicosPorLocal", () => {
  it("retorna unidade e serviços ativos com as quantidades da fila", async () => {
    mockFrom
      .mockReturnValueOnce(
        queryBuilder({
          data: {
            id: "local-1",
            nome: "Resolve Palmas",
            endereco: "Centro",
            horario_abertura: null,
            horario_fechamento: null,
            ativo: true,
          },
          error: null,
        })
      )
      .mockReturnValueOnce(
        queryBuilder({
          data: [
            {
              id: "servico-1",
              titulo: "Emissão de documentos",
              descricao: "RG, CPF e documentos",
              setor: "Identificação",
              icone: null,
              cor_icone: null,
              cor_fundo: null,
              tempo_medio_minutos: 10,
            },
            {
              id: "servico-2",
              titulo: "Atendimento tributário",
              descricao: null,
              setor: null,
              icone: null,
              cor_icone: null,
              cor_fundo: null,
              tempo_medio_minutos: null,
            },
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

    const resultado = await listarServicosPorLocal("local-1");

    expect(resultado.unidade).toEqual({
      id: "local-1",
      nome: "Resolve Palmas",
      endereco: "Centro",
      aberto: true,
      pessoasAguardando: 5,
    });

    expect(resultado.servicos).toHaveLength(2);

    expect(resultado.servicos[0]).toMatchObject({
      id: "servico-1",
      titulo: "Emissão de documentos",
      descricao: "RG, CPF e documentos",
      setor: "Identificação",
      pessoasAguardando: 3,
      tempoMedioMinutos: 10,
      icon: "document-text-outline",
      iconColor: "#0757D8",
      iconBackground: "#EDF4FF",
    });

    expect(resultado.servicos[1]).toMatchObject({
      id: "servico-2",
      descricao: "",
      setor: "Não informado",
      pessoasAguardando: 2,
      tempoMedioMinutos: 15,
    });

    expect(mockContarEspera).toHaveBeenCalledWith([
      "servico-1",
      "servico-2",
    ]);
  });

  it("propaga erro quando a consulta do local falha", async () => {
    const erro = new Error("falha ao buscar local");

    mockFrom.mockReturnValueOnce(
      queryBuilder({
        data: null,
        error: erro,
      })
    );

    await expect(
      listarServicosPorLocal("local-1")
    ).rejects.toThrow("falha ao buscar local");

    expect(mockContarEspera).not.toHaveBeenCalled();
  });
});
