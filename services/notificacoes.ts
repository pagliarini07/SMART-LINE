import { supabase } from "./supabase";

export type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadaEm: string;
};

type NotificacaoRow = {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
};

function paraNotificacao(linha: NotificacaoRow): Notificacao {
  return {
    id: linha.id,
    titulo: linha.titulo,
    mensagem: linha.mensagem,
    lida: linha.lida,
    criadaEm: linha.created_at,
  };
}

/** Lista as notificações do usuário, mais recentes primeiro. */
export async function listarNotificacoes(
  userId: string
): Promise<Notificacao[]> {
  const { data, error } = await supabase
    .from("notificacoes")
    .select("id, titulo, mensagem, lida, created_at")
    .eq("usuario_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as NotificacaoRow[]).map(paraNotificacao);
}

/** Conta quantas notificações do usuário ainda não foram lidas. */
export async function contarNaoLidas(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notificacoes")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", userId)
    .eq("lida", false);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function marcarComoLida(id: string): Promise<void> {
  const { error } = await supabase
    .from("notificacoes")
    .update({ lida: true })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

// Código do Postgres pra "violação de unique constraint" — usado aqui
// pra saber quando a notificação "sua vez está chegando" já existe pra
// essa senha (não é um erro de verdade, só evita duplicar).
const UNIQUE_VIOLATION = "23505";

/**
 * Gatilho real de notificação: quando a senha ativa do usuário estiver a
 * 1-2 posições de ser chamada, garante que existe uma notificação pra
 * ela. Seguro de chamar toda vez que a tela recarrega — a constraint
 * unique em notificacoes.senha_id impede duplicar.
 */
export async function notificarSeProximo(
  userId: string,
  senha: { id: string; codigo: string; servico: string; posicao: number }
): Promise<void> {
  if (senha.posicao > 2) {
    return;
  }

  const { error } = await supabase.from("notificacoes").insert({
    usuario_id: userId,
    senha_id: senha.id,
    titulo: "Sua vez está chegando!",
    mensagem: `Sua senha ${senha.codigo} (${senha.servico}) está em ${senha.posicao}º lugar na fila.`,
  });

  if (error && error.code !== UNIQUE_VIOLATION) {
    throw error;
  }
}
