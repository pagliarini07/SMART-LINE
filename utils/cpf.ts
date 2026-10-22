
/**
 * Valida um CPF usando os dois dígitos verificadores.
 * Aceita CPF com ou sem pontuação.
 */
export function validarCPF(cpf: string): boolean {
  const digitos = cpf.replace(/\D/g, "");

  // O CPF deve possuir exatamente 11 dígitos.
  if (digitos.length !== 11) {
    return false;
  }

  // Rejeita sequências com todos os dígitos iguais.
  if (/^(\d)\1{10}$/.test(digitos)) {
    return false;
  }

  const calcularDigito = (base: string, pesoInicial: number): number => {
    let soma = 0;

    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (pesoInicial - i);
    }

    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  // Valida o primeiro dígito verificador.
  const primeiroDigito = calcularDigito(digitos.slice(0, 9), 10);

  if (primeiroDigito !== Number(digitos[9])) {
    return false;
  }

  // Valida o segundo dígito verificador.
  const segundoDigito = calcularDigito(digitos.slice(0, 10), 11);

  if (segundoDigito !== Number(digitos[10])) {
    return false;
  }

  return true;
}
