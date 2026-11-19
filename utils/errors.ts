// Traduz mensagens de erro cruas do Supabase (em inglês, às vezes só
// "Failed to fetch") em algo que faz sentido pro usuário final.
//
// Única função de tradução de erro do app (issue #113) -- antes havia
// uma segunda versão em services/senhas.ts (mensagemErroCancelamento)
// que reimplementava a mesma lógica só pra cancelar senha. Usa
// duck-typing em vez de `error instanceof Error` de propósito: os
// erros de auth do supabase-js são instâncias de Error, mas os erros
// de RPC/Postgrest (ex.: cancelar_senha) são objetos simples com
// `message` -- a checagem por `.message` cobre os dois casos.
export function mensagemErroSupabase(
  error: unknown,
  // Mensagem usada quando o erro não bate com nenhum padrão conhecido.
  // Se omitida, repassa a mensagem original do erro (útil em telas onde
  // o texto cru do Supabase ainda ajuda a diagnosticar, como login).
  // Passe algo aqui pra garantir que nunca aparece texto técnico pro
  // usuário (como em "sair da fila").
  mensagemPadrao?: string
): string {
  const mensagemOriginal = String(
    (error as { message?: unknown } | null)?.message ?? ""
  );

  if (!mensagemOriginal) {
    return "Ocorreu um erro inesperado. Tente novamente.";
  }

  const mensagem = mensagemOriginal.toLowerCase();

  if (mensagem.includes("failed to fetch") || mensagem.includes("network")) {
    return "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.";
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

  return mensagemPadrao ?? mensagemOriginal;
}
