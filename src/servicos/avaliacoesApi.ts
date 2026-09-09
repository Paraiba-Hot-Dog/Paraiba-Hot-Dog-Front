import { apiFetch } from "./apiFetch";

export const NOTA_MINIMA = 1;
export const NOTA_MAXIMA = 5;

export type AvaliacaoApi = {
  id: number;
  nome_cliente: string;
  descricao: string;
  estrelas: number;
  ativo: boolean;
};

export type AvaliacaoFormApi = {
  nome_cliente: string;
  descricao: string;
  estrelas: number;
};

/** Campos que podem ser alterados numa avaliacao existente (tudo menos o id). */
export type AvaliacaoUpdateApi = Partial<Omit<AvaliacaoApi, "id">>;

async function respostaJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;

  let mensagem = `Erro ${response.status}`;

  try {
    const body = (await response.json()) as { detail?: string };
    if (body.detail) mensagem = body.detail;
  } catch {
    // Mantem a mensagem baseada no status quando a API nao retorna JSON.
  }

  throw new Error(mensagem);
}

export async function listarAvaliacoesApi(ativo?: boolean) {
  return respostaJson<AvaliacaoApi[]>(
    await apiFetch("/avaliacoes", {
      auth: false,
      params: { ativo, limit: 100 },
    }),
  );
}

export async function listarTodasAvaliacoesApi() {
  const [visiveis, ocultas] = await Promise.all([
    listarAvaliacoesApi(true),
    listarAvaliacoesApi(false),
  ]);

  return [...visiveis, ...ocultas].sort((a, b) => a.id - b.id);
}

export async function criarAvaliacaoApi(dados: AvaliacaoFormApi) {
  return respostaJson<AvaliacaoApi>(
    await apiFetch("/avaliacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome_cliente: dados.nome_cliente,
        descricao: dados.descricao,
        estrelas: dados.estrelas,
      }),
    }),
  );
}

export async function atualizarAvaliacaoApi(
  id: number,
  dados: AvaliacaoUpdateApi,
) {
  return respostaJson<AvaliacaoApi>(
    await apiFetch(`/avaliacoes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    }),
  );
}

export async function excluirAvaliacaoApi(id: number) {
  const response = await apiFetch(`/avaliacoes/${id}`, { method: "DELETE" });

  if (!response.ok && response.status !== 204) {
    throw new Error(`Erro ${response.status} ao excluir avaliação`);
  }
}

export function notaValida(estrelas: number) {
  return (
    Number.isInteger(estrelas) &&
    estrelas >= NOTA_MINIMA &&
    estrelas <= NOTA_MAXIMA
  );
}

export function limitarNota(estrelas: number) {
  if (Number.isNaN(estrelas)) return NOTA_MINIMA;
  return Math.min(NOTA_MAXIMA, Math.max(NOTA_MINIMA, Math.round(estrelas)));
}
