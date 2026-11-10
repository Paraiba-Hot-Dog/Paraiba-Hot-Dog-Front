import type {
  CategoriaRead,
  ProdutoCardapio,
  ProdutoRead,
  SecaoCardapio,
  SubcategoriaRead,
} from "../model/cardapio";
import { apiFetch, buildApiUrl } from "../servicos/apiFetch";

export const ORDEM_CATEGORIAS_STORAGE_KEY =
  "paraiba-hotdog:cardapio:ordem-categorias";

function lerOrdemCategoriasSalva() {
  if (typeof window === "undefined") return [];

  try {
    const valor = window.localStorage.getItem(ORDEM_CATEGORIAS_STORAGE_KEY);
    if (!valor) return [];

    const ids = JSON.parse(valor);
    return Array.isArray(ids)
      ? ids.filter((id): id is number => Number.isInteger(id))
      : [];
  } catch {
    return [];
  }
}

function indiceCategoriaOrdenada(categoriaId: number, ordem: number[]) {
  const indice = ordem.indexOf(categoriaId);
  return indice === -1 ? Number.MAX_SAFE_INTEGER : indice;
}

export function salvarOrdemCategorias(categorias: CategoriaRead[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    ORDEM_CATEGORIAS_STORAGE_KEY,
    JSON.stringify(categorias.map((categoria) => categoria.id)),
  );
}

export function ordenarCategoriasCardapio(
  categorias: CategoriaRead[],
): CategoriaRead[] {
  const ordem = lerOrdemCategoriasSalva();

  return [...categorias].sort(
    (a, b) =>
      indiceCategoriaOrdenada(a.id, ordem) -
      indiceCategoriaOrdenada(b.id, ordem),
  );
}

export function ordenarSecoesCardapio(
  secoes: SecaoCardapio[],
): SecaoCardapio[] {
  const ordem = lerOrdemCategoriasSalva();

  return [...secoes].sort(
    (a, b) =>
      indiceCategoriaOrdenada(a.categoria_id, ordem) -
      indiceCategoriaOrdenada(b.categoria_id, ordem),
  );
}

const buscarJson = async <T>(
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>,
): Promise<T> => {
  const response = await apiFetch(path, { auth: false, params });
  if (!response.ok) {
    throw new Error(`Erro ao buscar ${path}`);
  }
  return response.json() as Promise<T>;
};

export async function listarCategoriasCardapio(): Promise<CategoriaRead[]> {
  return ordenarCategoriasCardapio(
    await buscarJson<CategoriaRead[]>("/produtos/categorias"),
  );
}

export async function listarSubcategoriasCardapio(): Promise<
  SubcategoriaRead[]
> {
  return await buscarJson<SubcategoriaRead[]>("/produtos/subcategorias");
}

function resolverUrlImagemCardapio(imagemUrl: string | null | undefined) {
  if (!imagemUrl) return null;
  if (/^https?:\/\//i.test(imagemUrl)) return imagemUrl;

  return buildApiUrl(imagemUrl.startsWith("/") ? imagemUrl : `/${imagemUrl}`);
}

function normalizarProdutoApi(produto: ProdutoRead): ProdutoCardapio {
  return {
    ...produto,
    variacoes: produto.variacoes ?? [],
    adicionais: produto.adicionais ?? [],
    grupos: produto.grupos ?? [],
    unidade_ids: produto.unidade_ids ?? [],
    disponivel_no_combo: produto.disponivel_no_combo ?? produto.disponivel_combo ?? false,
    valor_adicional_combo: Number(produto.valor_adicional_combo ?? 0),
    imagem_url: resolverUrlImagemCardapio(produto.imagem_url),
  };
}

export async function listarSecoesCardapio(
  unidadeId?: number | null,
  incluirInativos = false,
  incluirCategoriasVazias = false,
): Promise<SecaoCardapio[]> {
  const [categorias, subcategorias, produtos] = await Promise.all([
    buscarJson<CategoriaRead[]>("/produtos/categorias"),
    buscarJson<SubcategoriaRead[]>("/produtos/subcategorias"),
    buscarJson<ProdutoRead[]>("/produtos/", {
      limit: 100,
      unidade_id: unidadeId ?? undefined,
    }),
  ]);

  return montarSecoes(
    ordenarCategoriasCardapio(categorias),
    subcategorias,
    produtos.map(normalizarProdutoApi),
    incluirInativos,
    incluirCategoriasVazias,
  );
}

function montarSecoes(
  categorias: CategoriaRead[],
  subcategorias: SubcategoriaRead[],
  produtos: ProdutoCardapio[],
  incluirInativos = false,
  incluirCategoriasVazias = false,
): SecaoCardapio[] {
  return categorias
    .map((categoria) => {
      const idsSubcategorias = subcategorias
        .filter((subcategoria) => subcategoria.categoria_id === categoria.id)
        .map((subcategoria) => subcategoria.id);

      return {
        id: categoria.nome
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, ""),
        categoria_id: categoria.id,
        titulo: categoria.nome,
        destaque:
          categoria.nome.toLowerCase().includes("bebida") ||
          categoria.nome.toLowerCase().includes("acompanhamento"),
        produtos: produtos.filter(
          (produto) =>
            (incluirInativos || produto.ativo) &&
            idsSubcategorias.includes(produto.subcategoria_id),
        ),
      };
    })
    .filter((secao) => incluirCategoriasVazias || secao.produtos.length > 0);
}
