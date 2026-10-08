// Traduz mensagens de erro cruas do Supabase (em inglês, às vezes só
// "Failed to fetch") em algo que faz sentido pro usuário final.
export function mensagemErroAuth(error: unknown): string {
  if (error instanceof Error) {
    const mensagem = error.message.toLowerCase();

    if (mensagem.includes("failed to fetch") || mensagem.includes("network")) {
      return "Não foi possível conectar ao servidor. Verifique sua internet (ou se o Supabase está configurado) e tente novamente.";
    }

    if (mensagem.includes("invalid login credentials")) {
      return "E-mail ou senha incorretos.";
    }

    if (mensagem.includes("user already registered")) {
      return "Já existe uma conta com esse e-mail.";
    }

    if (mensagem.includes("email not confirmed")) {
      return "Confirme seu e-mail antes de entrar.";
    }

    return error.message;
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
}
