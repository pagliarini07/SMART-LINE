export type Coordenadas = {
  latitude: number;
  longitude: number;
};

export type DestinoRota = {
  id: string;
  latitude: number | null;
  longitude: number | null;
};

type RespostaOSRM = {
  code?: string;
  message?: string;
  distances?: (number | null)[][];
};

const OSRM_URL = "https://router.project-osrm.org";

function coordenadasValidas(
  coordenadas: { latitude: number | null; longitude: number | null }
): coordenadas is Coordenadas {
  return (
    typeof coordenadas.latitude === "number" &&
    Number.isFinite(coordenadas.latitude) &&
    Math.abs(coordenadas.latitude) <= 90 &&
    typeof coordenadas.longitude === "number" &&
    Number.isFinite(coordenadas.longitude) &&
    Math.abs(coordenadas.longitude) <= 180
  );
}

/**
 * Calcula a distância pelas ruas usando o OSRM Table Service.
 * Faz uma única requisição para todos os locais.
 * Retorna distâncias em metros, identificadas pelo ID do local.
 */
export async function calcularDistanciasPorRota(
  origem: Coordenadas,
  destinos: DestinoRota[]
): Promise<Record<string, number | null>> {
  if (!coordenadasValidas(origem)) {
    throw new Error("Coordenadas de origem inválidas.");
  }

  const destinosValidos = destinos.filter(coordenadasValidas);

  if (destinosValidos.length === 0) {
    return {};
  }

  const coordenadas = [
    origem,
    ...destinosValidos,
  ]
    .map(({ latitude, longitude }) => `${longitude},${latitude}`)
    .join(";");

  const indices = destinosValidos
    .map((_, index) => index + 1)
    .join(";");

  const url =
    `${OSRM_URL}/table/v1/driving/${coordenadas}` +
    `?sources=0&destinations=${indices}` +
    "&annotations=distance&skip_waypoints=true&generate_hints=false";

  const resposta = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!resposta.ok) {
    throw new Error(`Erro no serviço de rotas: HTTP ${resposta.status}`);
  }

  const dados = (await resposta.json()) as RespostaOSRM;

  if (dados.code !== "Ok" || !Array.isArray(dados.distances?.[0])) {
    throw new Error(
      dados.message ?? `Não foi possível calcular as rotas: ${dados.code}`
    );
  }

  const distancias = dados.distances[0];

  return destinosValidos.reduce<Record<string, number | null>>(
    (resultado, destino, index) => {
      const distancia = distancias[index];

      resultado[destino.id] =
        typeof distancia === "number" &&
        Number.isFinite(distancia) &&
        distancia >= 0
          ? distancia
          : null;

      return resultado;
    },
    {}
  );
}

/**
 * Formata distâncias recebidas em metros.
 */
export function formatarDistancia(
  distanciaMetros: number | null
): string | null {
  if (
    distanciaMetros === null ||
    !Number.isFinite(distanciaMetros) ||
    distanciaMetros < 0
  ) {
    return null;
  }

  if (Math.round(distanciaMetros) < 1000) {
    return `${Math.round(distanciaMetros)} m`;
  }

  return `${(distanciaMetros / 1000).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}
