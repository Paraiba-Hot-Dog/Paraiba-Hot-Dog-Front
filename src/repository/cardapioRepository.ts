import type {
  CategoriaRead,
  ProdutoAdicionalRead,
  ProdutoCardapio,
  ProdutoRead,
  SecaoCardapio,
  SubcategoriaRead,
} from "../model/cardapio";
import { apiFetch, buildApiUrl } from "../servicos/apiFetch";

export const categoriasFallback: CategoriaRead[] = [
  { id: 1, nome: "Smashdogs" },
  { id: 2, nome: "Hotdogs" },
  { id: 3, nome: "Bebidas" },
  { id: 4, nome: "Acompanhamentos" },
];

export const subcategoriasFallback: SubcategoriaRead[] = categoriasFallback.map((categoria) => ({
  id: categoria.id,
  nome: categoria.nome,
  categoria_id: categoria.id,
}));

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

const produtoBase = {
  ativo: true,
  pontos_fidelidade_por_unidade: 0,
  disponivel_todas_unidades: true,
  unidade_ids: [],
};

const adicionaisHotDog = [
  { nome: "Salsicha extra", preco: 4 },
  { nome: "Carne moída", preco: 5 },
  { nome: "Queijo muçarela", preco: 4 },
  { nome: "Ovo de codorna", preco: 3 },
  { nome: "Batata palha extra", preco: 2 },
] as const;

const adicionaisSmash = [
  { nome: "Burger artesanal 120g", preco: 10 },
  { nome: "Bacon em tiras", preco: 5 },
  { nome: "Queijo muçarela", preco: 4 },
  { nome: "Maionese artesanal", preco: 3 },
  { nome: "Alface, tomate e cebola roxa", preco: 3 },
] as const;

const adicionaisBebida = [
  { nome: "Xarope extra", preco: 3 },
  { nome: "Copo com gelo", preco: 1 },
] as const;

const montarAdicionais = (
  produtoId: number,
  adicionais: readonly { nome: string; preco: number }[],
): ProdutoAdicionalRead[] =>
  adicionais.map((adicional, index) => ({
    id: produtoId * 100 + index,
    produto_id: produtoId,
    nome: adicional.nome,
    preco: adicional.preco,
  }));

const criarProduto = (
  id: number,
  subcategoriaId: number,
  nome: string,
  descricao: string,
  imagemLocal: string,
  preco: number,
  precoCombo?: number,
  adicionais: readonly { nome: string; preco: number }[] = [],
): ProdutoCardapio => ({
  ...produtoBase,
  id,
  subcategoria_id: subcategoriaId,
  nome,
  descricao,
  imagem_url: resolverUrlImagemCardapio(`/uploads/produtos/${imagemLocal}`),
  adicionais: montarAdicionais(id, adicionais),
  variacoes: [
    {
      id: id * 10,
      produto_id: id,
      nome: "Normal",
      tipo: "normal",
      preco,
      ativo: true,
    },
    ...(precoCombo
      ? [
          {
            id: id * 10 + 1,
            produto_id: id,
            nome: "Combo",
            tipo: "combo" as const,
            preco: precoCombo,
            ativo: true,
          },
        ]
      : []),
  ],
});

export const produtosFallback: ProdutoCardapio[] = [
  criarProduto(
    1,
    1,
    "Facheiro",
    "Pão brioche, blend artesanal 120g, muçarela e maionese.",
    "smash-facheiro.jpeg",
    22,
    undefined,
    adicionaisSmash,
  ),
  criarProduto(
    2,
    1,
    "Mandacaru",
    "Baguete de massa brioche, burger 120g, queijo muçarela, alface americana, tomate e cebola roxa.",
    "smash-mandacaru.jpeg",
    25,
    undefined,
    adicionaisSmash,
  ),
  criarProduto(
    3,
    1,
    "Xique-Xique",
    "Baguete em massa de pão australiano, burger 120g, queijo muçarela e bacon em tiras.",
    "smash-xiquexique.jpeg",
    27,
    undefined,
    adicionaisSmash,
  ),
  criarProduto(
    4,
    1,
    "Facheiro Duplo",
    "Baguete em massa de brioche, burger 240g, queijo muçarela e maionese artesanal.",
    "smash-facheiro.jpeg",
    29,
    undefined,
    adicionaisSmash,
  ),
  criarProduto(
    5,
    1,
    "Mandacaru Duplo",
    "Baguete de massa brioche, burger 240g, queijo muçarela, alface americana, tomate e cebola roxa.",
    "smash-mandacaru.jpeg",
    33,
    undefined,
    adicionaisSmash,
  ),
  criarProduto(
    6,
    1,
    "Xique-Xique Duplo",
    "Baguete em massa de pão australiano, burger 240g, queijo muçarela e bacon em tiras.",
    "smash-xiquexique.jpeg",
    35,
    undefined,
    adicionaisSmash,
  ),
  criarProduto(
    7,
    1,
    "Facheiro Triplo",
    "Baguete em massa de brioche, burger 360g, queijo muçarela e maionese artesanal.",
    "smash-facheiro.jpeg",
    36,
    undefined,
    adicionaisSmash,
  ),
  criarProduto(
    8,
    1,
    "Mandacaru Triplo",
    "Baguete de massa brioche, burger 360g, queijo muçarela, alface americana, tomate e cebola roxa.",
    "smash-mandacaru-triplo.jpeg",
    40,
    undefined,
    adicionaisSmash,
  ),
  criarProduto(
    9,
    1,
    "Xique-Xique Triplo",
    "Baguete em massa de pão australiano, burger 360g, queijo muçarela e bacon em tiras.",
    "smash-xiquexique.jpeg",
    42,
    undefined,
    adicionaisSmash,
  ),
  criarProduto(
    10,
    2,
    "Tradicional",
    "Pão de leite Ninho, salsicha Perdigão, queijo muçarela artesanal, molho de tomate caseiro, milho e batata palha.",
    "dog-tradicional.jpeg",
    17,
    27,
    adicionaisHotDog,
  ),
  criarProduto(
    11,
    2,
    "Paraibano",
    "Pão de leite Ninho, salsicha Perdigão, carne moída temperada, molho de tomate artesanal, milho, vinagrete, parmesão e ovo de codorna.",
    "dog-paraibano.jpeg",
    21,
    31,
    adicionaisHotDog,
  ),
  criarProduto(
    12,
    2,
    "Paraibano Duplo",
    "Pão de leite Ninho, 2 salsichas Perdigão, carne moída temperada, molho de tomate caseiro, milho, vinagrete, parmesão e ovo de codorna.",
    "dog-paraibano.jpeg",
    26,
    36,
    adicionaisHotDog,
  ),
  criarProduto(
    13,
    2,
    "Arretado",
    "Pão de leite Ninho, salsicha Perdigão, queijo muçarela artesanal, carne moída temperada, milho, vinagrete, parmesão e batata palha.",
    "dog-arretado.jpeg",
    24,
    34,
    adicionaisHotDog,
  ),
  criarProduto(
    14,
    2,
    "Vegetariano",
    "Pão de leite Ninho, queijo muçarela artesanal, molho de tomate caseiro, milho, vinagrete, ovo de codorna e batata palha.",
    "dog-vegetariano.jpeg",
    20,
    30,
    adicionaisHotDog,
  ),
  criarProduto(
    15,
    2,
    "Arretado Duplo",
    "Pão de leite Ninho, 2 salsichas Perdigão, queijo muçarela artesanal, molho de tomate caseiro, carne moída temperada, milho, vinagrete, parmesão e batata palha.",
    "dog-arretado.jpeg",
    29,
    39,
    adicionaisHotDog,
  ),
  criarProduto(
    16,
    2,
    "Tradicional Duplo",
    "Pão de leite Ninho, 2 salsichas Perdigão, queijo muçarela artesanal, molho de tomate caseiro, milho e batata palha.",
    "dog-tradicional.jpeg",
    22,
    32,
    adicionaisHotDog,
  ),
  criarProduto(
    17,
    2,
    "Bixin",
    "Pão de leite Ninho, salsicha Perdigão, molho de tomate caseiro e batata palha.",
    "dog-bixin.jpeg",
    12,
    22,
    adicionaisHotDog,
  ),
  criarProduto(
    18,
    2,
    "Bixin Duplo",
    "Pão de leite Ninho, 2 salsichas Perdigão, molho de tomate caseiro e batata palha.",
    "dog-bixin.jpeg",
    17,
    27,
    adicionaisHotDog,
  ),
  criarProduto(
    19,
    3,
    "Refrigerante",
    "Coca-Cola, Coca-Cola Zero, Guaraná, Guaraná Zero, Fanta Laranja e Sprite.",
    "bedida-soda.jpeg",
    7,
    undefined,
    adicionaisBebida,
  ),
  criarProduto(
    20,
    3,
    "Sucos Integral",
    "Laranja e uva.",
    "bedida-soda.jpeg",
    9,
    undefined,
    adicionaisBebida,
  ),
  criarProduto(
    21,
    3,
    "Soda Italiana",
    "Copo 400ml com gelo, 50ml de xarope, água gaseificada 500ml e canudo.",
    "bedida-soda.jpeg",
    10,
    undefined,
    adicionaisBebida,
  ),
  criarProduto(
    22,
    4,
    "Paraíba Chips",
    "Batata inglesa cortada em chips e frita no óleo de palma. 50g.",
    "dog-bixin.jpeg",
    8,
  ),
  criarProduto(
    23,
    4,
    "Maionese Artesanal",
    "Maionese caseira de alho, tradicional, ervas, apimentada ou bacon. Porção 30g.",
    "smash-facheiro.jpeg",
    3,
  ),
];

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
    unidade_ids: produto.unidade_ids ?? [],
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
