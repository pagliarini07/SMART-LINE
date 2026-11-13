/**
 * Roda a bateria de pedidos (supabase/functions/triagem/casos-triagem.json)
 * contra a IA de verdade e diz quantos ela acertou. Issue #95.
 *
 * Uso (PowerShell), com um usuário de teste do app:
 *   $env:TRIAGEM_EMAIL="teste@exemplo.com"; $env:TRIAGEM_SENHA="..."
 *   node scripts/avaliar-triagem.mjs
 *
 * Opcional: TRIAGEM_INTERVALO_MS (padrão 5000) pra não estourar o limite
 * de pedidos por minuto do plano gratuito do Gemini.
 *
 * Precisa do Node 22.18+ (lê o avaliacao.ts direto, sem compilar).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import {
  avaliarCaso,
  gruposIncoerentes,
} from "../supabase/functions/triagem/avaliacao.ts";

function lerEnv() {
  const env = {};

  try {
    for (const linha of readFileSync(".env", "utf8").split(/\r?\n/)) {
      const [chave, ...resto] = linha.split("=");
      if (chave && resto.length && !chave.startsWith("#")) {
        env[chave.trim()] = resto.join("=").trim();
      }
    }
  } catch {
    // Sem .env: usa só as variáveis do terminal.
  }

  return { ...env, ...process.env };
}

const env = lerEnv();
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const chave = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const intervalo = Number(env.TRIAGEM_INTERVALO_MS ?? 5000);

if (!url || !chave || !env.TRIAGEM_EMAIL || !env.TRIAGEM_SENHA) {
  console.error(
    "Defina TRIAGEM_EMAIL e TRIAGEM_SENHA (usuário de teste) e rode da pasta do projeto, onde está o .env."
  );
  process.exit(2);
}

const supabase = createClient(url, chave, {
  auth: { persistSession: false },
});

const { error: erroLogin } = await supabase.auth.signInWithPassword({
  email: env.TRIAGEM_EMAIL,
  password: env.TRIAGEM_SENHA,
});

if (erroLogin) {
  console.error("Não foi possível entrar:", erroLogin.message);
  process.exit(2);
}

const { data: servicos, error: erroCatalogo } = await supabase
  .from("servicos")
  .select("id, titulo, locais(nome)")
  .eq("ativo", true);

if (erroCatalogo) {
  console.error("Não foi possível ler o catálogo:", erroCatalogo.message);
  process.exit(2);
}

const catalogo = servicos.map((servico) => ({
  id: servico.id,
  titulo: servico.titulo,
  local: servico.locais?.nome ?? "",
}));

const { casos } = JSON.parse(
  readFileSync(
    new URL("../supabase/functions/triagem/casos-triagem.json", import.meta.url),
    "utf8"
  )
);

console.log(`Catálogo: ${catalogo.length} serviços. Casos: ${casos.length}.\n`);

const resultados = [];

for (const [indice, caso] of casos.entries()) {
  const { data, error } = await supabase.functions.invoke("triagem", {
    body: { pedido: caso.pedido },
  });

  let avaliacao;

  if (error) {
    const status = error.context?.status ?? "sem resposta";
    avaliacao = { ok: false, obtido: `erro ${status}`, problema: "a função falhou" };
  } else {
    avaliacao = avaliarCaso(caso, data, catalogo);
  }

  const titulo = data?.servico_id
    ? catalogo.find((servico) => servico.id === data.servico_id)?.titulo ?? null
    : null;

  resultados.push({ caso, titulo, ...avaliacao });

  console.log(
    `${avaliacao.ok ? "OK  " : "FALHOU"} [${caso.tipo}] "${caso.pedido}"\n` +
      `       -> ${avaliacao.obtido}` +
      (avaliacao.problema ? `\n       !! ${avaliacao.problema}` : "")
  );

  if (indice < casos.length - 1) {
    await new Promise((ok) => setTimeout(ok, intervalo));
  }
}

const acertos = resultados.filter((resultado) => resultado.ok).length;
const incoerentes = gruposIncoerentes(resultados);

console.log(
  `\nAcertos: ${acertos}/${resultados.length} (${Math.round(
    (acertos / resultados.length) * 100
  )}%)`
);
// Aviso, não falha: no grupo do RG, "Emissão de documentos" e
// "Identificação civil – CIN" são ambos aceitos, mas vale saber se a IA
// alterna entre eles.
console.log(
  incoerentes.length
    ? `Aviso: pedidos equivalentes caíram em serviços diferentes (todos aceitos) nos grupos: ${incoerentes.join(", ")}`
    : "Pedidos equivalentes deram recomendações coerentes."
);

process.exit(acertos === resultados.length ? 0 : 1);
