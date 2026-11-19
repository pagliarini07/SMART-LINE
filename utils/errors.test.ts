import { mensagemErroSupabase } from "./errors";

describe("mensagemErroSupabase", () => {
  it("traduz erro de rede ('Failed to fetch') pra uma mensagem amigável", () => {
    const mensagem = mensagemErroSupabase(new Error("Failed to fetch"));
    expect(mensagem).toMatch(/não foi possível conectar/i);
  });

  it("traduz credenciais inválidas", () => {
    const mensagem = mensagemErroSupabase(
      new Error("Invalid login credentials")
    );
    expect(mensagem).toBe("E-mail ou senha incorretos.");
  });

  it("traduz e-mail já cadastrado", () => {
    const mensagem = mensagemErroSupabase(
      new Error("User already registered")
    );
    expect(mensagem).toBe("Já existe uma conta com esse e-mail.");
  });

  it("traduz e-mail não confirmado", () => {
    const mensagem = mensagemErroSupabase(new Error("Email not confirmed"));
    expect(mensagem).toBe("Confirme seu e-mail antes de entrar.");
  });

  it("repassa a mensagem original quando não reconhece o erro e nenhuma mensagem padrão foi informada", () => {
    const mensagem = mensagemErroSupabase(new Error("algo bem especifico"));
    expect(mensagem).toBe("algo bem especifico");
  });

  it("usa a mensagem padrão informada em vez da mensagem crua, quando não reconhece o erro", () => {
    const mensagem = mensagemErroSupabase(
      new Error("algo bem especifico"),
      "Não foi possível sair da fila agora. Tente novamente."
    );
    expect(mensagem).toBe(
      "Não foi possível sair da fila agora. Tente novamente."
    );
  });

  it("retorna uma mensagem genérica quando o valor nem tem 'message'", () => {
    const mensagem = mensagemErroSupabase("string qualquer");
    expect(mensagem).toBe("Ocorreu um erro inesperado. Tente novamente.");
  });

  // Erros de RPC/Postgrest (ex.: cancelar_senha) não são instâncias de
  // Error, só objetos simples com "message" -- por isso a função usa
  // duck-typing em vez de `instanceof Error`.
  it("reconhece erros que não são instâncias de Error, desde que tenham 'message'", () => {
    const erroPostgrest = { code: "PGRST000", message: "Failed to fetch" };
    const mensagem = mensagemErroSupabase(erroPostgrest);
    expect(mensagem).toMatch(/não foi possível conectar/i);
  });
});
