/**
 * Avaliação da bateria de pedidos da triagem (issue #95).
 *
 * Funções puras: recebem o caso, a resposta da função "triagem" e o
 * catálogo real, e dizem se a IA acertou. Usadas nos testes automatizados
 * e no script scripts/avaliar-triagem.mjs, que roda a bateria contra a IA
 * de verdade.
 */

export type CasoTriagem = {
  grupo: string;
  tipo: string;
  pedido: string;
  /** Trechos de título aceitos (qualquer um vale). */
  servicos?: string[];
  /** "pergunta": não deve recomendar; "sem_servico": nada do catálogo serve. */
  resultado?: "pergunta" | "sem_servico";
  /** Para pedidos que podem ser ambíguos: perguntar também é aceito. */
  aceita_pergunta?: boolean;
};

export type RespostaTriagem = {
  servico_id: string | null;
  confianca: number;
  pergunta_esclarecimento: string | null;
  alternativas: string[];
};

export type ServicoCatalogo = { id: string; titulo: string; local: string };

export type ResultadoCaso = {
  ok: boolean;
  obtido: string;
  problema?: string;
};

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** O título do serviço contém algum dos trechos esperados? */
export function tituloCombina(titulo: string, trechos: string[]): boolean {
  const alvo = normalizar(titulo);
  return trechos.some((trecho) => alvo.includes(normalizar(trecho)));
}

export function avaliarCaso(
  caso: CasoTriagem,
  resposta: RespostaTriagem,
  catalogo: ServicoCatalogo[]
): ResultadoCaso {
  const porId = new Map(catalogo.map((servico) => [servico.id, servico]));

  // Regra que vale pra todo caso: nada fora do catálogo.
  const idsCitados = [
    ...(resposta.servico_id ? [resposta.servico_id] : []),
    ...resposta.alternativas,
  ];
  const inventado = idsCitados.find((id) => !porId.has(id));

  if (inventado) {
    return {
      ok: false,
      obtido: `id ${inventado}`,
      problema: "recomendou serviço que não existe no catálogo",
    };
  }

  const escolhido = resposta.servico_id ? porId.get(resposta.servico_id) : null;
  const obtido = escolhido
    ? `${escolhido.titulo} (${escolhido.local}) ${Math.round(resposta.confianca * 100)}%`
    : `pergunta: ${resposta.pergunta_esclarecimento ?? "(nenhuma)"}`;

  if (caso.resultado === "pergunta" || caso.resultado === "sem_servico") {
    if (escolhido) {
      return { ok: false, obtido, problema: "chutou um serviço em vez de perguntar" };
    }

    if (!resposta.pergunta_esclarecimento) {
      return { ok: false, obtido, problema: "não recomendou nem perguntou nada" };
    }

    return { ok: true, obtido };
  }

  if (!escolhido) {
    return caso.aceita_pergunta && resposta.pergunta_esclarecimento
      ? { ok: true, obtido }
      : { ok: false, obtido, problema: "não recomendou o serviço esperado" };
  }

  if (!tituloCombina(escolhido.titulo, caso.servicos ?? [])) {
    return { ok: false, obtido, problema: "recomendou o serviço errado" };
  }

  return { ok: true, obtido };
}

/**
 * Pedidos equivalentes (mesmo grupo) devem levar ao mesmo tipo de serviço.
 * Devolve os grupos em que as recomendações não batem entre si.
 */
export function gruposIncoerentes(
  resultados: { caso: CasoTriagem; titulo: string | null }[]
): string[] {
  const titulosPorGrupo = new Map<string, Set<string>>();

  for (const { caso, titulo } of resultados) {
    if (!caso.servicos || !titulo) {
      continue;
    }

    // Agrupa pelo trecho esperado que combinou, não pelo título exato:
    // IPTU no Resolve Centro ou no Taquaralto conta como o mesmo serviço.
    const trecho =
      caso.servicos.find((t) => tituloCombina(titulo, [t])) ?? titulo;
    const titulos = titulosPorGrupo.get(caso.grupo) ?? new Set<string>();
    titulos.add(normalizar(trecho));
    titulosPorGrupo.set(caso.grupo, titulos);
  }

  return [...titulosPorGrupo]
    .filter(([, titulos]) => titulos.size > 1)
    .map(([grupo]) => grupo);
}
