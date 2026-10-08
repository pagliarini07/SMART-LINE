import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY " +
      "não configuradas. Crie um arquivo .env na raiz do projeto (veja " +
      ".env.example) com as credenciais do Supabase. Sem isso o app abre, " +
      "mas login, cadastro e perfil não vão funcionar."
  );
}

// Usa um valor de fallback só pra não derrubar o app inteiro (createClient
// lança erro de sincrono se a URL vier vazia) quando o .env não existe —
// as chamadas de auth/banco vão falhar normalmente e cair nos catch já
// existentes em login.tsx/cadastro.tsx/perfil.tsx.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabasePublishableKey || "placeholder-key",
  {
    auth: {
      ...(Platform.OS !== "web"
        ? { storage: AsyncStorage }
        : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
