import { mensagemErroAuth } from "./errors";

describe("mensagemErroAuth", () => {
  it("traduz erro de rede ('Failed to fetch') pra uma mensagem amigável", () => {
    const mensagem = mensagemErroAuth(new Error("Failed to fetch"));
    expect(mensagem).toMatch(/não foi possível conectar/i);
  });

  it("traduz credenciais inválidas", () => {
    const mensagem = mensagemErroAuth(new Error("Invalid login credentials"));
    expect(mensagem).toBe("E-mail ou senha incorretos.");
  });

  it("traduz e-mail já cadastrado", () => {
    const mensagem = mensagemErroAuth(new Error("User already registered"));
    expect(mensagem).toBe("Já existe uma conta com esse e-mail.");
  });

  it("traduz e-mail não confirmado", () => {
    const mensagem = mensagemErroAuth(new Error("Email not confirmed"));
    expect(mensagem).toBe("Confirme seu e-mail antes de entrar.");
  });

  it("repassa a mensagem original quando não reconhece o erro", () => {
    const mensagem = mensagemErroAuth(new Error("algo bem especifico"));
    expect(mensagem).toBe("algo bem especifico");
  });

  it("retorna uma mensagem genérica quando o valor nem é um Error", () => {
    const mensagem = mensagemErroAuth("string qualquer");
    expect(mensagem).toBe("Ocorreu um erro inesperado. Tente novamente.");
  });
});
