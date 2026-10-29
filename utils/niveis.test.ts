import { calcularPercentual, formatarPontos } from "./niveis";

describe("calcularPercentual", () => {
  it("calcula a porcentagem entre dois valores", () => {
    expect(calcularPercentual(50, 100)).toBe(50);
    expect(calcularPercentual(1, 4)).toBe(25);
  });

  it("nunca passa de 100%, mesmo se o valor atual for maior que o necessário", () => {
    expect(calcularPercentual(150, 100)).toBe(100);
  });

  it("lida com necessario igual a 0 sem quebrar (resultado Infinity, limitado a 100)", () => {
    expect(calcularPercentual(10, 0)).toBe(100);
  });
});

describe("formatarPontos", () => {
  it("formata números no padrão brasileiro, sem casas decimais", () => {
    expect(formatarPontos(1450)).toBe("1.450");
    expect(formatarPontos(0)).toBe("0");
  });
});
