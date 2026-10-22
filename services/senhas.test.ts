jest.mock("./supabase", () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from "./supabase";
import { getHistoricoSenhas, getSenhaAtiva } from "./senhas";

type ResultadoMock = {
  data?: unknown;
  error?: unknown;
  count?: number;
};

// Monta um "query builder" falso que imita a API encadeável do
// supabase-js (select().eq().not()...). Todo método intermediário
// devolve o próprio builder; maybeSingle()/single() resolvem o
// resultado, e o builder também é "thenable" pra cobrir o caso em que
// o código em services/senhas.ts dá await direto na chain (sem
// chamar maybeSingle/single), como na consulta de contagem.
function queryBuilder(resultado: ResultadoMock) {
  const builder: Record<string, unknown> = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    not: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    lte: jest.fn(() => builder),
    maybeSingle: jest.fn(() => Promise.resolve(resultado)),
    single: jest.fn(() => Promise.resolve(resultado)),
    then: (resolve: (valor: ResultadoMock) => unknown) =>
      Promise.resolve(resultado).then(resolve),
  };

  return builder;
}

const mockFrom = supabase.from as jest.Mock;

beforeEach(() => {
  mockFrom.mockReset();
});

describe("getSenhaAtiva", () => {
  it("retorna null quando o usuário não tem senha em aberto", async () => {
    mockFrom.mockReturnValueOnce(
      queryBuilder({ data: null, error: null })
    );

    const resultado = await getSenhaAtiva("usuario-1");

    expect(resultado).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith("senhas");
  });

  it("monta codigo, posicao e tempo estimado a partir do servico/local reais", async () => {
    mockFrom
      .mockReturnValueOnce(
        queryBuilder({
          data: {
            id: "senha-1",
            servico_id: "servico-1",
            status: "aguardando",
            retirada_em: "2026-01-01T10:00:00.000Z",
          },
          error: null,
        })
      )
      .mockReturnValueOnce(
        queryBuilder({
          data: {
            titulo: "Emissão de documentos",
            prefixo_senha: "A",
            tempo_medio_minutos: 5,
            local_id: "local-1",
          },
          error: null,
        })
      )
      .mockReturnValueOnce(
        queryBuilder({ data: { nome: "Resolve Palmas" }, error: null })
      )
      .mockReturnValueOnce(queryBuilder({ count: 3, error: null }));

    const resultado = await getSenhaAtiva("usuario-1");

    expect(resultado).toEqual({
      id: "senha-1",
      codigo: "A003",
      servico: "Emissão de documentos",
      local: "Resolve Palmas",
      posicao: 3,
      tempoEstimadoMinutos: 15,
    });
  });

  it("propaga o erro quando a consulta principal falha", async () => {
    const erro = new Error("falha de rede");
    mockFrom.mockReturnValueOnce(
      queryBuilder({ data: null, error: erro })
    );

    await expect(getSenhaAtiva("usuario-1")).rejects.toThrow(
      "falha de rede"
    );
  });
});

describe("getHistoricoSenhas", () => {
  it("retorna [] quando o usuário não tem nenhum atendimento finalizado", async () => {
    mockFrom.mockReturnValueOnce(
      queryBuilder({ data: [], error: null })
    );

    const resultado = await getHistoricoSenhas("usuario-1");

    expect(resultado).toEqual([]);
  });

  it("junta senha + servico + local e formata data/hora em pt-BR", async () => {
    mockFrom
      .mockReturnValueOnce(
        queryBuilder({
          data: [
            {
              id: "senha-1",
              servico_id: "servico-1",
              status: "atendido",
              retirada_em: "2026-01-01T10:00:00.000Z",
              atendido_em: "2026-01-01T10:20:00.000Z",
              finalizado_em: "2026-01-01T10:25:00.000Z",
            },
          ],
          error: null,
        })
      )
      .mockReturnValueOnce(
        queryBuilder({
          data: [
            {
              id: "servico-1",
              titulo: "Emissão de documentos",
              local_id: "local-1",
            },
          ],
          error: null,
        })
      )
      .mockReturnValueOnce(
        queryBuilder({
          data: [{ id: "local-1", nome: "Resolve Palmas" }],
          error: null,
        })
      );

    const resultado = await getHistoricoSenhas("usuario-1");

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      id: "senha-1",
      servico: "Emissão de documentos",
      local: "Resolve Palmas",
      status: "atendido",
    });
  });
});
