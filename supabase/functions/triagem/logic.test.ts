import {
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
});

describe("validarTriagemResposta", () => {
  const ids = new Set(["servico-1", "servico-2"]);

  const respostaValida = {
    servico_id: "servico-1",
    confianca: 0.9,
    motivo: "O serviço corresponde ao pedido.",
    documentos: ["Documento com foto"],
    alternativas: ["servico-2"],
    pergunta_esclarecimento: null,
  };

  it("aceita apenas serviços existentes no catálogo", () => {
    expect(validarTriagemResposta(respostaValida, ids)).toEqual(respostaValida);

    expect(() =>
      validarTriagemResposta(
        { ...respostaValida, servico_id: "servico-inexistente" },
        ids
      )
    ).toThrow("serviço inexistente");
  });

  it("rejeita alternativa inexistente ou repetida", () => {
    expect(() =>
      validarTriagemResposta(
        { ...respostaValida, alternativas: ["servico-inexistente"] },
        ids
      )
    ).toThrow("alternativa inválida");

    expect(() =>
      validarTriagemResposta(
        { ...respostaValida, alternativas: ["servico-2", "servico-2"] },
        ids
      )
    ).toThrow("alternativa inválida");
  });
});
