import { mascararCPF, validarCPF } from "./cpf";

describe("mascararCPF", () => {
  it("formata o CPF completo", () => {
    expect(mascararCPF("12345678909")).toBe("123.456.789-09");
  });

  it("formata enquanto o usuário ainda está digitando", () => {
    expect(mascararCPF("123")).toBe("123");
    expect(mascararCPF("1234")).toBe("123.4");
    expect(mascararCPF("1234567")).toBe("123.456.7");
    expect(mascararCPF("1234567890")).toBe("123.456.789-0");
  });

  it("ignora o que não é número e corta em 11 dígitos", () => {
    expect(mascararCPF("123.456.789-09999")).toBe("123.456.789-09");
  });
});

describe("validarCPF", () => {
  it("aceita CPF válido com ou sem máscara", () => {
    expect(validarCPF("123.456.789-09")).toBe(true);
    expect(validarCPF("12345678909")).toBe(true);
  });

  it("rejeita CPF inválido", () => {
    expect(validarCPF("123.456.789-00")).toBe(false);
    expect(validarCPF("111.111.111-11")).toBe(false);
  });
});
