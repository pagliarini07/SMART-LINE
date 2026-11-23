
import { supabase } from "./supabase";

export type Profile = {
  id: string;
  nome: string | null;
  cpf: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileChanges = {
  nome: string;
  cpf: string;
  email: string;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, cpf, email, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveProfile(
  userId: string,
  changes: ProfileChanges
): Promise<Profile> {
  const { data, error } = await supabase
    .from("usuarios")
    .update({
      nome: changes.nome,
      cpf: changes.cpf || null,
      email: changes.email,
    })
    .eq("id", userId)
    .select("id, nome, cpf, email, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Atualiza o e-mail de login do usuário no Supabase Auth (issue #106).
 *
 * Decisão registrada na issue: o campo "E-mail" do Perfil passa a refletir
 * o e-mail de login, em vez de ser só um contato separado -- editar aqui
 * também muda com o que o usuário entra na conta. O Supabase manda um link
 * de confirmação pro endereço novo; o e-mail de login só muda de fato
 * depois que o usuário confirmar (até lá, `auth.users.email`/`user.email`
 * continua sendo o antigo). Por isso isso é chamado antes de salvar
 * `usuarios.email`: se falhar (ex.: e-mail já usado por outra conta), o
 * perfil não fica com um e-mail "pendente" sem confirmação nenhuma.
 */
export async function atualizarEmailLogin(email: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email });

  if (error) {
    throw error;
  }
}
