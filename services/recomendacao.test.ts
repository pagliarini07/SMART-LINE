jest.mock("./supabase", () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));

import { supabase } from "./supabase";
import { LIMIAR_CONFIANCA, recomendarServico } from "./recomendacao";

function queryBuilder(resultado: { data?: unknown; error?: unknown }) {
  const builder: Record<string, unknown> = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    not: jest.fn(() => builder),
    then: (resolve: (valor: typeof resultado) => unknown) =>
      Promise.resolve(resultado).then(resolve),
  };

  return builder;
}

const SERVICOS = [
  {
    id: "servico-documentos",
    titulo: "Emissão de documentos",
    descricao: "RG, CPF, CNH e 2ª via de documentos.",
    setor: "Identificação",
    documentos_sugeridos: null,
    local_id: "local-1",
  },
  {
    id: "servico-tributario",
    titulo: "Atendimento tributário",
    descricao: "IPTU, ITBI, Alvará e demais tributos.",
    setor: "Tributos",
    documentos_sugeridos: null,
    local_id: "local-1",
  },
];

const LOCAIS = [{ id: "local-1", nome: "Resolve Palmas — Centro" }];

const mockFrom = supabase.from as jest.Mock;
const mockRpc = supabase.rpc as jest.Mock;

beforeEach(() => {
  mockFrom.mockReset();
  mockRpc.mockReset();
  // contagem_espera (issue #93): por padrão, fila vazia -- os testes que
  // se importam com o número exato sobrescrevem isso.
  mockRpc.mockResolvedValue({ data: 0, error: null });
});

describe("recomendarServico", () => {
  it("recomenda 'Emissão de documentos' pro exemplo da issue (2ª via de RG)", async () => {
    mockFrom
      .mockReturnValueOnce(queryBuilder({ data: SERVICOS, error: null }))
      .mockReturnValueOnce(queryBuilder({ data: LOCAIS, error: null }));

    const resultado = await recomendarServico(
      "preciso tirar a segunda via do meu RG"
    );

    expect(resultado).not.toBeNull();
    expect(resultado?.servicoId).toBe("servico-documentos");
    expect(resultado?.nomeLocal).toBe("Resolve Palmas — Centro");
    expect(resultado?.confianca).toBeGreaterThanOrEqual(LIMIAR_CONFIANCA);
    expect(resultado?.documentosSugeridos.length).toBeGreaterThan(0);
    // Contagem de fila agora vem da RPC contagem_espera (issue #93),
    // não mais de consultar a tabela senhas direto (bloqueada por RLS).
    expect(mockRpc).toHaveBeenCalledWith("contagem_espera", {
      p_servico_id: "servico-documentos",
    });
  });


  it("prioriza os documentos cadastrados no serviço", async () => {
    const servicosComDocumentos = [
      {
        ...SERVICOS[0],
        documentos_sugeridos: ["Certidão original", "CPF"],
      },
    ];

    mockFrom
      .mockReturnValueOnce(
        queryBuilder({ data: servicosComDocumentos, error: null })
      )
      .mockReturnValueOnce(queryBuilder({ data: LOCAIS, error: null }))
      .mockReturnValueOnce(queryBuilder({ data: [], error: null }));

    const resultado = await recomendarServico("preciso da segunda via do RG");

    expect(resultado?.documentosSugeridos).toEqual([
      "Certidão original",
      "CPF",
    ]);
  });

  it("retorna null quando o pedido não bate com nenhum serviço", async () => {
    mockFrom
      .mockReturnValueOnce(queryBuilder({ data: SERVICOS, error: null }))
      .mockReturnValueOnce(queryBuilder({ data: LOCAIS, error: null }));

    const resultado = await recomendarServico("quero adotar um gatinho");

    expect(resultado).toBeNull();
  });

  it("retorna null para um pedido vazio/sem palavras-chave", async () => {
    const resultado = await recomendarServico("   ");

    expect(resultado).toBeNull();
    // Nem chega a consultar o banco, já que não há palavra-chave.
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
