import { readFileSync } from "fs";
import { join } from "path";
import {
  CasoTriagem,
  ServicoCatalogo,
  avaliarCaso,
  gruposIncoerentes,
  tituloCombina,
} from "./avaliacao";
import {
  aplicarPoliticaConfianca,
  sanitizarPedido,
  validarTriagemResposta,
} from "./logic";

const { casos } = JSON.parse(
  readFileSync(join(__dirname, "casos-triagem.json"), "utf8")
) as { casos: CasoTriagem[] };

// Recorte do catálogo real de Palmas, com serviços repetidos em vários
// locais (IPTU em 3 unidades do Resolve, CIN em 2).
const catalogo: ServicoCatalogo[] = [
  { id: "cnh", titulo: "Habilitação – CNH", local: "DETRAN-TO – Sede de Palmas" },
  { id: "veic", titulo: "Veículos – transferência e licenciamento", local: "DETRAN-TO – Sede de Palmas" },
  { id: "iptu-centro", titulo: "Tributos municipais – IPTU e ITBI", local: "Resolve Palmas — Centro" },
  { id: "iptu-taq", titulo: "Tributos municipais – IPTU e ITBI", local: "Resolve Palmas – Taquaralto" },
  { id: "iptu-capim", titulo: "Tributos municipais – IPTU e ITBI", local: "Resolve Palmas – Capim Dourado" },
  { id: "cin-taq", titulo: "Identificação civil – CIN", local: "Resolve Palmas – Taquaralto" },
  { id: "cin-capim", titulo: "Identificação civil – CIN", local: "Resolve Palmas – Capim Dourado" },
  { id: "cartorio", titulo: "Atendimento geral", local: "Cartório 2º Ofício" },
];

function resposta(
  servico_id: string | null,
  extra: Partial<{ confianca: number; pergunta: string | null; alternativas: string[] }> = {}
) {
  return {
    servico_id,
    confianca: extra.confianca ?? 0.9,
    pergunta_esclarecimento: extra.pergunta ?? null,
    alternativas: extra.alternativas ?? [],
  };
}

const casoCnh: CasoTriagem = {
  grupo: "cnh",
  tipo: "direto",
  pedido: "Quero renovar minha CNH",
  servicos: ["Habilitação"],
};

const casoVago: CasoTriagem = {
  grupo: "vago",
  tipo: "vago",
  pedido: "Preciso resolver um documento",
  resultado: "pergunta",
};

describe("bateria de pedidos (casos-triagem.json)", () => {
  it("cobre os pedidos pedidos na issue #95", () => {
    const pedidos = casos.map((caso) => caso.pedido.toLowerCase());

    for (const pedido of [
      "preciso tirar a segunda via do rg",
      "quero renovar minha cnh",
      "preciso reconhecer firma",
      "quero pagar iptu",
      "preciso protocolar um documento",
      "quero uma certidão",
      "preciso transferir um veículo",
    ]) {
      expect(pedidos).toContain(pedido);
    }
  });

  it("tem variações, erros de português, pedidos curtos, com contexto e vagos", () => {
    const tipos = new Set(casos.map((caso) => caso.tipo));

    for (const tipo of [
      "variacao",
      "erro_portugues",
      "curto",
      "contexto",
      "vago",
      "fora_do_catalogo",
      "privacidade",
    ]) {
      expect(tipos).toContain(tipo);
    }
  });

  it("todo caso diz o que espera (serviço ou pergunta)", () => {
    for (const caso of casos) {
      expect(caso.pedido.trim().length).toBeGreaterThan(0);
      expect(caso.pedido.length).toBeLessThanOrEqual(300);
      expect(Boolean(caso.servicos?.length) !== Boolean(caso.resultado)).toBe(true);
    }
  });

  it("dados pessoais dos casos não chegam à IA", () => {
    for (const caso of casos.filter((c) => c.tipo === "privacidade")) {
      const seguro = sanitizarPedido(caso.pedido);

      expect(seguro).not.toMatch(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/);
      expect(seguro).toContain("[CPF_REMOVIDO]");
      expect(seguro).toContain("[NOME_REMOVIDO]");
    }
  });
});

describe("avaliarCaso", () => {
  it("aprova o serviço esperado", () => {
    expect(avaliarCaso(casoCnh, resposta("cnh"), catalogo).ok).toBe(true);
  });

  it("reprova serviço errado", () => {
    const resultado = avaliarCaso(casoCnh, resposta("veic"), catalogo);

    expect(resultado.ok).toBe(false);
    expect(resultado.problema).toBe("recomendou o serviço errado");
  });

  it("reprova serviço inventado, mesmo em alternativa", () => {
    expect(avaliarCaso(casoCnh, resposta("inventado"), catalogo).problema).toBe(
      "recomendou serviço que não existe no catálogo"
    );
    expect(
      avaliarCaso(casoCnh, resposta("cnh", { alternativas: ["inventado"] }), catalogo).ok
    ).toBe(false);
  });

  it("aceita qualquer local que ofereça o serviço (catálogo com vários locais)", () => {
    const casoIptu: CasoTriagem = {
      grupo: "iptu",
      tipo: "direto",
      pedido: "Quero pagar IPTU",
      servicos: ["IPTU"],
    };

    for (const id of ["iptu-centro", "iptu-taq", "iptu-capim"]) {
      expect(avaliarCaso(casoIptu, resposta(id), catalogo).ok).toBe(true);
    }
  });

  it("pedido vago: aprova pergunta e reprova chute", () => {
    expect(
      avaliarCaso(casoVago, resposta(null, { pergunta: "Qual documento?" }), catalogo).ok
    ).toBe(true);
    expect(avaliarCaso(casoVago, resposta("cartorio"), catalogo).problema).toBe(
      "chutou um serviço em vez de perguntar"
    );
    expect(avaliarCaso(casoVago, resposta(null), catalogo).ok).toBe(false);
  });

  it("pedido que pode ser ambíguo aceita pergunta quando marcado", () => {
    const casoCertidao: CasoTriagem = {
      grupo: "certidao",
      tipo: "direto",
      pedido: "Quero uma certidão",
      servicos: ["Atendimento geral"],
      aceita_pergunta: true,
    };

    expect(
      avaliarCaso(casoCertidao, resposta(null, { pergunta: "Qual certidão?" }), catalogo).ok
    ).toBe(true);
    expect(avaliarCaso(casoCnh, resposta(null, { pergunta: "Qual?" }), catalogo).ok).toBe(
      false
    );
  });
});

describe("tituloCombina", () => {
  it("ignora acento e maiúsculas", () => {
    expect(tituloCombina("Habilitação – CNH", ["habilitacao"])).toBe(true);
    expect(tituloCombina("Identificação civil – CIN", ["IDENTIFICAÇÃO CIVIL"])).toBe(true);
    expect(tituloCombina("Atendimento geral", ["IPTU"])).toBe(false);
  });
});

describe("gruposIncoerentes", () => {
  it("pedidos equivalentes no mesmo serviço (mesmo em locais diferentes) são coerentes", () => {
    const casoIptu: CasoTriagem = { ...casoCnh, grupo: "iptu", servicos: ["IPTU"] };

    expect(
      gruposIncoerentes([
        { caso: casoCnh, titulo: "Habilitação – CNH" },
        { caso: casoCnh, titulo: "Habilitação – CNH" },
        { caso: casoIptu, titulo: "Tributos municipais – IPTU e ITBI" },
        { caso: casoIptu, titulo: "Tributos municipais – IPTU e ITBI" },
      ])
    ).toEqual([]);
  });

  it("aponta grupo em que pedidos equivalentes deram serviços diferentes", () => {
    const casoRg: CasoTriagem = {
      ...casoCnh,
      grupo: "rg",
      servicos: ["Identificação civil", "Emissão de documentos"],
    };

    expect(
      gruposIncoerentes([
        { caso: casoRg, titulo: "Identificação civil – CIN" },
        { caso: casoRg, titulo: "Emissão de documentos" },
      ])
    ).toEqual(["rg"]);
  });
});

describe("caminho completo (resposta da IA -> validação -> política -> avaliação)", () => {
  const ids = new Set(catalogo.map((servico) => servico.id));

  function processar(respostaIA: object) {
    return aplicarPoliticaConfianca(validarTriagemResposta(respostaIA, ids));
  }

  const base = {
    confianca: 0.9,
    motivo: "Combina com o pedido.",
    documentos: [],
    alternativas: [],
    pergunta_esclarecimento: null,
  };

  it("IA inventando serviço para pedido válido nunca vira recomendação", () => {
    const final = processar({ ...base, servico_id: "passaporte-inventado" });
    const avaliacao = avaliarCaso(casoCnh, final, catalogo);

    expect(final.servico_id).toBeNull();
    expect(avaliacao.problema).not.toBe("recomendou serviço que não existe no catálogo");
  });

  it("IA chutando com confiança baixa num pedido vago vira pergunta aprovada", () => {
    const final = processar({ ...base, servico_id: "cartorio", confianca: 0.2 });

    expect(avaliarCaso(casoVago, final, catalogo).ok).toBe(true);
  });
});
