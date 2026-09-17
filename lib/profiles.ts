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
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

// upsert em vez de update: contas criadas antes da tabela/trigger existirem
// ainda não têm uma linha em profiles, então a primeira gravação a cria.
export async function saveProfile(
  userId: string,
  changes: ProfileChanges
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...changes }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
