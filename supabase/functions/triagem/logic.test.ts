import {
  CONFIANCA_DESCARTE,
  CONFIANCA_MINIMA,
  ErroProvedorIA,
  PERGUNTA_PADRAO_AMBIGUO,
  PERGUNTA_PADRAO_SEM_SERVICO,
  TriagemResposta,
  aplicarPoliticaConfianca,
  extrairJsonDaIA,
  extrairTextoGemini,
  respostaDeFalhaDaIA,
  sanitizarPedido,
  validarTriagemResposta,
} from "./logic";

describe("sanitizarPedido", () => {
  it("remove CPF, e-mail, telefone e nome explicitamente informado", () => {
    const seguro = sanitizarPedido(
      "Meu nome é João da Silva e preciso da segunda via do RG. CPF 123.456.789-00, email joao@example.com, telefone (63) 99999-8888."
    );

    expect(seguro).toContain("[NOME_REMOVIDO]");
    expect(seguro).toContain("[CPF_REMOVIDO]");
    expect(seguro).toContain("[EMAIL_REMOVIDO]");
    expect(seguro).toContain("[TELEFONE_REMOVIDO]");
    expect(seguro).not.toContain("João da Silva");
    expect(seguro).not.toContain("123.456.789-00");
    expect(seguro).not.toContain("joao@example.com");
    expect(seguro).not.toContain("99999-8888");
    expect(seguro).toContain("preciso da segunda via do RG");
  });

  it("remove CPF sem pontuação e telefone sem DDD", () => {
    const seguro = sanitizarPedido(
      "quero renovar a CNH, cpf 12345678909, meu número 99999-8888"
    );

    expect(seguro).not.toContain("12345678909");
    expect(seguro).not.toContain("99999-8888");
    expect(seguro).toContain("quero renovar a CNH");
  });

  it("remove nome em outras formas de se apresentar", () => {
    expect(sanitizarPedido("me chamo Maria Souza, quero pagar IPTU")).not.toContain(
      "Maria Souza"
    );
    expect(sanitizarPedido("Nome: Pedro Lima. Preciso de certidão")).not.toContain(
      "Pedro Lima"
    );
  });

  it("não mexe em pedido sem dados pessoais", () => {
    expect(sanitizarPedido("  preciso reconhecer firma  ")).toBe(
      "preciso reconhecer firma"
    );
  });
});

describe("validarTriagemResposta", () => {
  const ids = new Set(["servico-1", "servico-2", "servico-3"]);

  const respostaValida = {
    servico_id: "servico-1",
    confianca: 0.9,
    motivo: "O serviço corresponde ao pedido.",
    documentos: ["Documento com foto"],
    alternativas: ["servico-2"],
    pergunta_esclarecimento: null,
  };

  it("aceita resposta com serviço existente no catálogo", () => {
    expect(validarTriagemResposta(respostaValida, ids)).toEqual(respostaValida);
  });

  it("descarta serviço inventado em vez de quebrar a triagem", () => {
    const resultado = validarTriagemResposta(
      { ...respostaValida, servico_id: "servico-inexistente" },
      ids
    );

    expect(resultado.servico_id).toBeNull();
    expect(resultado.confianca).toBe(0);
  });

  it("ignora alternativa inventada, repetida ou igual à principal", () => {
    const resultado = validarTriagemResposta(
      {
        ...respostaValida,
        alternativas: ["servico-inexistente", "servico-1"],
      },
      ids
    );
    expect(resultado.alternativas).toEqual([]);

    const repetida = validarTriagemResposta(
      { ...respostaValida, alternativas: ["servico-2", "servico-2"] },
      ids
    );
    expect(repetida.alternativas).toEqual(["servico-2"]);
  });

  it("mantém só 2 alternativas quando a IA manda mais (serviço em vários locais)", () => {
    const resultado = validarTriagemResposta(
      {
        ...respostaValida,
        alternativas: ["servico-2", "inventado", "servico-3", "servico-2"],
      },
      new Set(["servico-1", "servico-2", "servico-3", "servico-4"])
    );

    expect(resultado.alternativas).toEqual(["servico-2", "servico-3"]);
  });

  it("corta motivo e pergunta longos em vez de recusar a resposta", () => {
    const resultado = validarTriagemResposta(
      {
        ...respostaValida,
        motivo: "a".repeat(500),
        pergunta_esclarecimento: "b".repeat(400),
      },
      ids
    );

    expect(resultado.motivo.length).toBeLessThanOrEqual(300);
    expect(resultado.pergunta_esclarecimento?.length).toBeLessThanOrEqual(220);
  });

  it("pergunta vazia conta como sem pergunta", () => {
    expect(
      validarTriagemResposta({ ...respostaValida, pergunta_esclarecimento: "  " }, ids)
        .pergunta_esclarecimento
    ).toBeNull();
  });

  it("corta documentos em excesso em vez de recusar a resposta", () => {
    const resultado = validarTriagemResposta(
      { ...respostaValida, documentos: ["a", "b", "c", "d", "e", "f", "g"] },
      ids
    );

    expect(resultado.documentos).toHaveLength(5);
  });

  it("rejeita resposta fora do formato", () => {
    expect(() => validarTriagemResposta("texto solto", ids)).toThrow();
    expect(() =>
      validarTriagemResposta({ ...respostaValida, servico_id: 123 }, ids)
    ).toThrow("servico_id");
    expect(() =>
      validarTriagemResposta({ ...respostaValida, confianca: 1.5 }, ids)
    ).toThrow("confianca");
    expect(() =>
      validarTriagemResposta({ ...respostaValida, confianca: "alta" }, ids)
    ).toThrow("confianca");
    expect(() =>
      validarTriagemResposta({ ...respostaValida, motivo: "" }, ids)
    ).toThrow("motivo");
  });
});

describe("aplicarPoliticaConfianca", () => {
  const base: TriagemResposta = {
    servico_id: "servico-1",
    confianca: 0.9,
    motivo: "Combina com o pedido.",
    documentos: ["Documento com foto"],
    alternativas: ["servico-2"],
    pergunta_esclarecimento: null,
  };

  it("mantém a recomendação quando a confiança é alta", () => {
    const resultado = aplicarPoliticaConfianca(base);

    expect(resultado.servico_id).toBe("servico-1");
    expect(resultado.pergunta_esclarecimento).toBeNull();
  });

  it("não manda pergunta junto de recomendação com confiança alta", () => {
    const resultado = aplicarPoliticaConfianca({
      ...base,
      pergunta_esclarecimento: "É isso mesmo?",
    });

    expect(resultado.pergunta_esclarecimento).toBeNull();
  });

  it("mantém serviço e alternativas na faixa de dúvida", () => {
    const meio = (CONFIANCA_DESCARTE + CONFIANCA_MINIMA) / 2;
    const resultado = aplicarPoliticaConfianca({ ...base, confianca: meio });

    expect(resultado.servico_id).toBe("servico-1");
    expect(resultado.alternativas).toEqual(["servico-2"]);
  });

  it("pedido vago (confiança muito baixa) vira pergunta, sem chute", () => {
    const resultado = aplicarPoliticaConfianca({
      ...base,
      confianca: 0.2,
      pergunta_esclarecimento: "Qual documento você precisa emitir ou regularizar?",
    });

    expect(resultado.servico_id).toBeNull();
    expect(resultado.alternativas).toEqual([]);
    expect(resultado.documentos).toEqual([]);
    expect(resultado.pergunta_esclarecimento).toBe(
      "Qual documento você precisa emitir ou regularizar?"
    );
  });

  it("usa pergunta padrão se a IA não mandar nenhuma", () => {
    const resultado = aplicarPoliticaConfianca({ ...base, confianca: 0.1 });

    expect(resultado.servico_id).toBeNull();
    expect(resultado.pergunta_esclarecimento).toBe(PERGUNTA_PADRAO_AMBIGUO);
  });

  it("sem serviço compatível sempre devolve uma pergunta", () => {
    const resultado = aplicarPoliticaConfianca({
      ...base,
      servico_id: null,
      confianca: 0,
    });

    expect(resultado.alternativas).toEqual([]);
    expect(resultado.pergunta_esclarecimento).toBe(PERGUNTA_PADRAO_SEM_SERVICO);
  });

  it("serviço inventado termina em pergunta, nunca em recomendação", () => {
    const resultado = aplicarPoliticaConfianca(
      validarTriagemResposta(
        { ...base, servico_id: "inventado", confianca: 0.95 },
        new Set(["servico-1", "servico-2"])
      )
    );

    expect(resultado.servico_id).toBeNull();
    expect(resultado.pergunta_esclarecimento).toBe(PERGUNTA_PADRAO_SEM_SERVICO);
  });
});

describe("extrairTextoGemini", () => {
  it("pega o texto ignorando blocos de pensamento", () => {
    const payload = {
      candidates: [
        {
          content: {
            parts: [{ text: "pensando...", thought: true }, { text: '{"a":1}' }],
          },
        },
      ],
    };

    expect(extrairTextoGemini(payload)).toBe('{"a":1}');
  });

  it("falha sem quebrar quando o Gemini não manda texto", () => {
    expect(() => extrairTextoGemini({})).toThrow("não retornou texto");
    expect(() => extrairTextoGemini({ candidates: [] })).toThrow(
      "não retornou texto"
    );
    expect(() => extrairTextoGemini(null)).toThrow("não retornou texto");
  });
});

describe("extrairJsonDaIA", () => {
  it("lê JSON puro e JSON cercado por ```json", () => {
    expect(extrairJsonDaIA('{"servico_id":null}')).toEqual({ servico_id: null });
    expect(extrairJsonDaIA('```json\n{"servico_id":null}\n```')).toEqual({
      servico_id: null,
    });
  });

  it("acusa JSON inválido", () => {
    expect(() => extrairJsonDaIA("Claro! O serviço é o RG.")).toThrow(
      "JSON inválido"
    );
    expect(() => extrairJsonDaIA('{"servico_id":')).toThrow("JSON inválido");
  });
});

describe("respostaDeFalhaDaIA", () => {
  it("cota esgotada ou Gemini fora do ar viram 503", () => {
    expect(respostaDeFalhaDaIA(new ErroProvedorIA(429)).status).toBe(503);
    expect(respostaDeFalhaDaIA(new ErroProvedorIA(500)).status).toBe(503);
    expect(respostaDeFalhaDaIA(new ErroProvedorIA(503)).status).toBe(503);
  });

  it("demora (abort do fetch) vira 504", () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";

    expect(respostaDeFalhaDaIA(abort).status).toBe(504);
  });

  it("resposta inutilizável ou erro de requisição viram 502", () => {
    expect(respostaDeFalhaDaIA(new Error("A IA retornou JSON inválido.")).status).toBe(
      502
    );
    expect(respostaDeFalhaDaIA(new ErroProvedorIA(400)).status).toBe(502);
    expect(respostaDeFalhaDaIA("qualquer coisa").status).toBe(502);
  });
});
