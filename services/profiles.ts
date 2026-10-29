
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
