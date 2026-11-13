import {
  calcularDistanciasPorRota,
  formatarDistancia,
} from "./localizacao";

const fetchMock = jest.spyOn(globalThis, "fetch");

afterAll(() => {
  fetchMock.mockRestore();
});

describe("calcularDistanciasPorRota", () => {
  const origem = {
    latitude: -10.18,
    longitude: -48.32,
  };

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("calcula distâncias de vários locais em uma única requisição", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: "Ok",
        distances: [[850, 2450]],
      }),
    } as Response);

    const resultado = await calcularDistanciasPorRota(origem, [
      {
        id: "local-1",
        latitude: -10.19,
        longitude: -48.33,
      },
      {
        id: "local-2",
        latitude: -10.20,
        longitude: -48.34,
      },
    ]);

    expect(resultado).toEqual({
      "local-1": 850,
      "local-2": 2450,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const url = String(fetchMock.mock.calls[0][0]);

    expect(url).toContain("/table/v1/driving/");
    expect(url).toContain("sources=0");
    expect(url).toContain("destinations=1;2");
    expect(url).toContain("annotations=distance");
  });

  it("retorna objeto vazio quando não existem destinos com coordenadas", async () => {
    const resultado = await calcularDistanciasPorRota(origem, [
      {
        id: "local-sem-coordenadas",
        latitude: null,
        longitude: null,
      },
    ]);

    expect(resultado).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("não inventa distância quando não existe rota disponível", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: "Ok",
        distances: [[null]],
      }),
    } as Response);

    const resultado = await calcularDistanciasPorRota(origem, [
      {
        id: "local-1",
        latitude: -10.19,
        longitude: -48.33,
      },
    ]);

    expect(resultado["local-1"]).toBeNull();
  });

  it("rejeita coordenadas inválidas na origem", async () => {
    await expect(
      calcularDistanciasPorRota(
        { latitude: 100, longitude: -48.32 },
        []
      )
    ).rejects.toThrow("Coordenadas de origem inválidas.");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("trata erros HTTP do serviço de rotas", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    await expect(
      calcularDistanciasPorRota(origem, [
        {
          id: "local-1",
          latitude: -10.19,
          longitude: -48.33,
        },
      ])
    ).rejects.toThrow("HTTP 503");
  });

  it("trata respostas inválidas do OSRM", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: "NoTable",
      }),
    } as Response);

    await expect(
      calcularDistanciasPorRota(origem, [
        {
          id: "local-1",
          latitude: -10.19,
          longitude: -48.33,
        },
      ])
    ).rejects.toThrow("NoTable");
  });
});

describe("formatarDistancia", () => {
  it("formata distâncias em metros", () => {
    expect(formatarDistancia(850)).toBe("850 m");
  });

  it("formata distâncias em quilômetros", () => {
    expect(formatarDistancia(1250)).toBe("1,3 km");
  });

  it("rejeita distâncias inválidas", () => {
    expect(formatarDistancia(null)).toBeNull();
    expect(formatarDistancia(-1)).toBeNull();
  });
});
