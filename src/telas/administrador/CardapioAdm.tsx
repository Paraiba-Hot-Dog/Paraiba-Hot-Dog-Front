import { ArrowDown, ArrowUp, Edit2, Plus, Trash2, X } from "lucide-react";
import type {
  CategoriaRead,
  ProdutoAdicionalRead,
  ProdutoCardapio,
  ProdutoVariacaoRead,
  SecaoCardapio,
  SubcategoriaRead,
  UnidadeRead,
} from "../../model/cardapio";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from "../../componentes/administrador/BarraDeNavegacaoAdmin";
import Rodape from "../../componentes/usuario/Rodape";
import {
  listarCategoriasCardapio,
  listarSecoesCardapio,
  listarSubcategoriasCardapio,
  ordenarSecoesCardapio,
  salvarOrdemCategorias,
} from "../../repository/cardapioRepository";
import { buildApiUrl, getStoredToken } from "../../servicos/apiFetch";

const formatadorPreco = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type ProdutoFormData = {
  nome: string;
  descricao: string;
  imagemUrl: string;
  imagemLocal: string;
  imagemArquivo: File | null;
  subcategoriaId: number;
  ativo: boolean;
  pontosFidelidadePorUnidade: string;
  disponivelTodasUnidades: boolean;
  unidadeIds: number[];
  preco: string;
  precoCombo: string;
  adicionais: ProdutoFormAdicional[];
};

type ProdutoFormAdicional = {
  id: string;
  nome: string;
  preco: string;
};

type CategoriaFormData = {
  nome: string;
};

type SubcategoriaFormData = {
  nome: string;
  categoriaId: number;
};

const modalOverlayClass =
  "fixed inset-0 z-[80] flex items-end bg-black/55 px-4 py-4 backdrop-blur-sm min-[640px]:items-center min-[640px]:justify-center";
const modalFormPanelClass =
  "max-h-[92vh] w-full overflow-y-auto rounded-[5px] border border-[#DADEE3] bg-white p-5 text-[#121212] shadow-[0_10px_30px_rgba(0,0,0,0.3)] min-[640px]:p-6";
const modalCompactPanelClass =
  "w-full max-w-md rounded-[5px] border border-[#DADEE3] bg-white p-5 text-[#121212] shadow-[0_10px_30px_rgba(0,0,0,0.3)]";
const modalTitleClass =
  "font-barlow text-base font-bold leading-4 tracking-[-0.4px] text-[#121212]";
const modalSubtitleClass =
  "mt-1 font-barlow-condensed text-sm font-normal leading-5 text-[#121212]";
const modalLabelClass =
  "text-xl font-barlow-condensed font-normal leading-5 text-[#121212]";
const modalInputClass =
  "mt-1 w-full rounded-[5px] border border-[#DADEE3] bg-[rgba(244,246,248,0.4)] px-3 py-2 font-barlow-condensed text-base font-normal text-[#121212] outline-none transition focus:border-amarelo focus:ring-2 focus:ring-amarelo/25";
const modalSecondaryButtonClass =
  "rounded-[6px] border-2 border-[#CCCCCC] px-5 py-3 font-barlow-condensed text-xl font-semibold uppercase tracking-wide text-[#666666] transition-colors hover:border-[#0A0A0A] hover:text-[#0A0A0A]";
const modalPrimaryButtonClass =
  "rounded-[6px] border-2 border-amarelo bg-amarelo px-5 py-3 font-barlow-condensed text-xl font-semibold uppercase tracking-wide text-[#121212] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
const modalDangerButtonClass =
  "rounded-[6px] border-2 border-[#D92B2B] bg-[#D92B2B] px-5 py-3 font-barlow-condensed text-xl font-semibold uppercase tracking-wide text-white transition-colors hover:border-red-700 hover:bg-red-700";

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function formatarPreco(preco: string | number) {
  return formatadorPreco.format(Number(preco));
}

function gerarIdCategoria(nome: string) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function apiEndpoint(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return buildApiUrl(path);
}

function readCookie(name: string) {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
}

function getAuthHeaders(): HeadersInit {
  const token =
    getStoredToken() ??
    localStorage.getItem("adminToken") ??
    readCookie("token") ??
    readCookie("access_token") ??
    readCookie("auth_token") ??
    readCookie("auth_token");

  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  Object.entries(getAuthHeaders()).forEach(([key, value]) => {
    headers.set(key, value);
  });

  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(apiEndpoint(path), {
    ...init,
    headers,
  });

  if (!response.ok) {
    let detail = `Erro ${response.status} em ${path}`;

    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") {
        detail = body.detail;
      }
    } catch {
      // Mantem a mensagem padrao quando a API nao retorna JSON.
    }

    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function isPersistedId(id: string) {
  return /^\d+$/.test(id);
}

function resolverUrlImagemAdmin(imagemUrl: string | null | undefined) {
  if (!imagemUrl) return null;
  if (/^https?:\/\//i.test(imagemUrl)) return imagemUrl;

  return buildApiUrl(imagemUrl.startsWith("/") ? imagemUrl : `/${imagemUrl}`);
}

function normalizarProdutoBackend(produto: ProdutoCardapio): ProdutoCardapio {
  return {
    ...produto,
    unidade_ids: produto.unidade_ids ?? [],
    variacoes: produto.variacoes ?? [],
    adicionais: produto.adicionais ?? [],
    imagem_url: resolverUrlImagemAdmin(produto.imagem_url),
  };
}

function criarProdutoMultipartPayload(
  form: ProdutoFormData,
  imagemArquivo?: File | null,
) {
  const formData = new FormData();

  formData.append("nome", form.nome);
  formData.append("descricao", form.descricao);
  formData.append("ativo", String(form.ativo));
  formData.append(
    "pontos_fidelidade_por_unidade",
    String(Number(form.pontosFidelidadePorUnidade || 0)),
  );
  formData.append(
    "disponivel_todas_unidades",
    String(form.disponivelTodasUnidades),
  );
  formData.append("subcategoria_id", String(form.subcategoriaId));
  if (imagemArquivo) {
    formData.append("imagem", imagemArquivo);
  }

  if (!form.disponivelTodasUnidades) {
    form.unidadeIds.forEach((unidadeId) => {
      formData.append("unidade_ids", String(unidadeId));
    });
  }

  return formData;
}

function criarVariacoes(
  produtoId: number,
  preco: string,
  precoCombo: string,
  variacoesAtuais: ProdutoVariacaoRead[] = [],
): ProdutoVariacaoRead[] {
  const variacaoNormal = variacoesAtuais.find(
    (variacao) => variacao.tipo === "normal",
  );
  const variacaoCombo = variacoesAtuais.find(
    (variacao) => variacao.tipo === "combo",
  );
  const variacoes: ProdutoVariacaoRead[] = [
    {
      id: variacaoNormal?.id ?? produtoId * 10,
      produto_id: produtoId,
      nome: "Normal",
      tipo: "normal",
      preco: Number(preco || 0),
      ativo: true,
    },
  ];

  if (precoCombo.trim()) {
    variacoes.push({
      id: variacaoCombo?.id ?? produtoId * 10 + 1,
      produto_id: produtoId,
      nome: "Combo",
      tipo: "combo",
      preco: Number(precoCombo || 0),
      ativo: true,
    });
  }

  return variacoes;
}

function criarAdicionais(
  produtoId: number,
  adicionais: ProdutoFormAdicional[],
): ProdutoAdicionalRead[] {
  return adicionais
    .filter((adicional) => adicional.nome.trim())
    .map((adicional, index) => ({
      id: isPersistedId(adicional.id)
        ? Number(adicional.id)
        : produtoId * 100 + index,
      produto_id: produtoId,
      nome: adicional.nome.trim(),
      preco: Number(adicional.preco.replace(",", ".") || 0),
    }));
}

function produtoParaForm(
  produto: ProdutoCardapio | null,
  subcategoriaId: number,
): ProdutoFormData {
  const precoNormal = produto?.variacoes.find(
    (variacao) => variacao.tipo === "normal",
  );
  const precoCombo = produto?.variacoes.find(
    (variacao) => variacao.tipo === "combo",
  );

  return {
    nome: produto?.nome ?? "",
    descricao: produto?.descricao ?? "",
    imagemUrl: produto?.imagem_url ?? "",
    imagemLocal: produto?.imagemLocal ?? "",
    imagemArquivo: null,
    subcategoriaId: produto?.subcategoria_id ?? subcategoriaId,
    ativo: produto?.ativo ?? true,
    pontosFidelidadePorUnidade:
      produto?.pontos_fidelidade_por_unidade.toString() ?? "0",
    disponivelTodasUnidades: produto?.disponivel_todas_unidades ?? true,
    unidadeIds: produto?.unidade_ids ?? [],
    preco: precoNormal?.preco.toString() ?? "",
    precoCombo: precoCombo?.preco.toString() ?? "",
    adicionais:
      produto?.adicionais.map((adicional) => ({
        id: adicional.id.toString(),
        nome: adicional.nome,
        preco: adicional.preco.toString(),
      })) ?? [],
  };
}

function produtoFromForm(
  id: number,
  form: ProdutoFormData,
  produtoAtual?: ProdutoCardapio,
): ProdutoCardapio {
  return {
    id,
    nome: form.nome,
    descricao: form.descricao,
    imagem_url: form.imagemUrl || produtoAtual?.imagem_url || null,
    imagemLocal: form.imagemLocal || produtoAtual?.imagemLocal,
    ativo: form.ativo,
    pontos_fidelidade_por_unidade: Number(
      form.pontosFidelidadePorUnidade || 0,
    ),
    disponivel_todas_unidades: form.disponivelTodasUnidades,
    subcategoria_id: form.subcategoriaId,
    unidade_ids: form.disponivelTodasUnidades ? [] : form.unidadeIds,
    variacoes: criarVariacoes(
      id,
      form.preco,
      form.precoCombo,
      produtoAtual?.variacoes,
    ),
    adicionais: criarAdicionais(id, form.adicionais),
  };
}

async function sincronizarVariacoes(
  produtoId: number,
  form: ProdutoFormData,
  produtoAtual?: ProdutoCardapio,
) {
  const variacaoNormal = produtoAtual?.variacoes.find(
    (variacao) => variacao.tipo === "normal",
  );
  const variacaoCombo = produtoAtual?.variacoes.find(
    (variacao) => variacao.tipo === "combo",
  );

  const precoNormal = Number(form.preco.replace(",", ".") || 0);
  const precoCombo = Number(form.precoCombo.replace(",", ".") || 0);

  if (precoNormal > 0) {
    const payload = {
      produto_id: produtoId,
      nome: "Normal",
      tipo: "normal",
      preco: precoNormal,
      ativo: true,
    };

    if (variacaoNormal) {
      await apiJson<ProdutoVariacaoRead>(
        `/produtos/variacoes/${variacaoNormal.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            nome: payload.nome,
            tipo: payload.tipo,
            preco: payload.preco,
            ativo: payload.ativo,
          }),
        },
      );
    } else {
      await apiJson<ProdutoVariacaoRead>("/produtos/variacoes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
  }

  if (form.precoCombo.trim() && precoCombo > 0) {
    const payload = {
      produto_id: produtoId,
      nome: "Combo",
      tipo: "combo",
      preco: precoCombo,
      ativo: true,
    };

    if (variacaoCombo) {
      await apiJson<ProdutoVariacaoRead>(
        `/produtos/variacoes/${variacaoCombo.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            nome: payload.nome,
            tipo: payload.tipo,
            preco: payload.preco,
            ativo: payload.ativo,
          }),
        },
      );
    } else {
      await apiJson<ProdutoVariacaoRead>("/produtos/variacoes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
  } else if (variacaoCombo) {
    await apiJson<void>(`/produtos/variacoes/${variacaoCombo.id}`, {
      method: "DELETE",
    });
  }
}

async function sincronizarAdicionais(
  produtoId: number,
  form: ProdutoFormData,
  produtoAtual?: ProdutoCardapio,
) {
  const adicionaisAtuais = produtoAtual?.adicionais ?? [];
  const adicionaisForm = form.adicionais.filter(
    (adicional) =>
      adicional.nome.trim() && Number(adicional.preco.replace(",", ".") || 0) > 0,
  );
  const idsMantidos = new Set(
    adicionaisForm
      .filter((adicional) => isPersistedId(adicional.id))
      .map((adicional) => Number(adicional.id)),
  );

  await Promise.all(
    adicionaisAtuais
      .filter((adicional) => !idsMantidos.has(adicional.id))
      .map((adicional) =>
        apiJson<void>(`/produtos/adicionais/${adicional.id}`, {
          method: "DELETE",
        }),
      ),
  );

  for (const adicional of adicionaisForm) {
    const payload = {
      produto_id: produtoId,
      nome: adicional.nome.trim(),
      preco: Number(adicional.preco.replace(",", ".") || 0),
    };

    if (isPersistedId(adicional.id)) {
      await apiJson<ProdutoAdicionalRead>(
        `/produtos/adicionais/${adicional.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            nome: payload.nome,
            preco: payload.preco,
          }),
        },
      );
    } else {
      await apiJson<ProdutoAdicionalRead>("/produtos/adicionais", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
  }
}

function NavegacaoCategorias({ categorias }: { categorias: CategoriaRead[] }) {
  return (
    <nav
      aria-label="Categorias do cardápio"
      className="sticky top-16 z-[60] bg-preto-v1/95 backdrop-blur"
    >
      <div className="pagina-container py-3">
        <div className="flex justify-start min-[900px]:justify-center">
          <ul className="inline-flex w-max min-w-max snap-x snap-mandatory items-stretch gap-0 overflow-x-auto rounded-[14px] border border-branco/10 bg-[#171717] px-1 shadow-[0_10px_24px_rgba(0,0,0,0.22)] [scroll-behavior:smooth] [-webkit-overflow-scrolling:touch]">
            {categorias.map((categoria) => (
              <li key={categoria.id} className="min-w-[7.25rem] snap-start flex-none min-[640px]:min-w-40">
                <a
                  href={`#${gerarIdCategoria(categoria.nome)}`}
                  className="flex items-center justify-center whitespace-nowrap border-b-2 px-4 py-4 font-barlow-condensed text-sm font-black uppercase leading-none text-branco/80 transition-colors duration-200 hover:border-branco/50 hover:text-branco focus:border-amarelo focus:text-amarelo focus:outline-none active:border-amarelo active:text-amarelo min-[640px]:px-6 min-[640px]:text-xl"
                >
                  {categoria.nome}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function CardProdutoAdm({
  produto,
  onView,
  onEdit,
  onDelete,
}: {
  produto: ProdutoCardapio;
  onView: (produto: ProdutoCardapio) => void;
  onEdit: (produto: ProdutoCardapio) => void;
  onDelete: (produto: ProdutoCardapio) => void;
}) {
  const precoNormal = produto.variacoes.find(
    (variacao) => variacao.tipo === "normal",
  );
  const precoCombo = produto.variacoes.find(
    (variacao) => variacao.tipo === "combo",
  );
  const imagem = produto.imagemLocal ?? produto.imagem_url ?? "";

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-[12px] bg-zinc-800 text-left shadow-[0_12px_24px_rgba(0,0,0,0.28)] outline-none transition-transform duration-300 hover:-translate-y-0.5 min-[640px]:h-44 min-[640px]:flex-row">
      <div className="order-3 flex gap-2 border-t border-branco/10 p-3 min-[640px]:absolute min-[640px]:right-2 min-[640px]:top-2 min-[640px]:z-10 min-[640px]:order-none min-[640px]:border-0 min-[640px]:p-0">
        <button
          type="button"
          onClick={() => onEdit(produto)}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[5px] bg-branco px-3 font-barlow-condensed text-base font-black uppercase text-preto-v1 shadow-[0_6px_14px_rgba(0,0,0,0.35)] transition-colors hover:bg-amarelo min-[640px]:h-9 min-[640px]:w-9 min-[640px]:flex-none min-[640px]:px-0"
          aria-label={`Editar ${produto.nome}`}
        >
          <Edit2 aria-hidden className="h-4 w-4" strokeWidth={2.5} />
          <span className="min-[640px]:sr-only">Editar</span>
        </button>
        <button
          type="button"
          onClick={() => onDelete(produto)}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[5px] bg-red-600 px-3 font-barlow-condensed text-base font-black uppercase text-branco shadow-[0_6px_14px_rgba(0,0,0,0.35)] transition-opacity hover:opacity-85 min-[640px]:h-9 min-[640px]:w-9 min-[640px]:flex-none min-[640px]:px-0"
          aria-label={`Excluir ${produto.nome}`}
        >
          <Trash2 aria-hidden className="h-4 w-4" strokeWidth={2.5} />
          <span className="min-[640px]:sr-only">Excluir</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => onView(produto)}
        className="order-2 grid min-h-[12rem] flex-1 grid-rows-[minmax(0,1fr)_3.25rem] gap-2 px-3 py-3 text-left text-branco outline-none focus-visible:ring-2 focus-visible:ring-amarelo min-[640px]:order-1 min-[640px]:min-h-0 min-[640px]:py-4 min-[640px]:pr-24"
        aria-label={`Ver detalhes de ${produto.nome}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-barlow text-lg font-black leading-tight drop-shadow-[0_3px_3px_rgba(0,0,0,0.2)] min-[640px]:line-clamp-2">
              {produto.nome}
            </h3>
            {!produto.ativo && (
              <span className="rounded-[5px] border border-red-400/50 px-2 py-0.5 font-barlow text-xs font-bold uppercase text-red-200">
                Inativo
              </span>
            )}
          </div>

          <p className="mt-1 line-clamp-5 font-barlow text-sm leading-[1.2] text-branco/85 drop-shadow-[0_3px_3px_rgba(0,0,0,0.15)] min-[640px]:line-clamp-2">
            {produto.descricao}
          </p>
        </div>

        <div className="flex h-[3.25rem] items-end justify-between gap-4 border-t border-branco/5 pt-2">
          <div className="min-h-[2.75rem] text-left font-barlow-condensed font-black text-branco">
            {precoNormal && (
              <p className="text-xl leading-none">
                {formatarPreco(precoNormal.preco)}
              </p>
            )}
            {precoCombo && (
              <p className="mt-1 text-sm leading-[0.95]">
                {formatarPreco(precoCombo.preco)}
                <span className="block text-xs text-amarelo">(COMBO)</span>
              </p>
            )}
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onView(produto)}
        className="order-1 h-44 w-full overflow-hidden border-b border-preto-v1 bg-preto-v3 outline-none focus-visible:ring-2 focus-visible:ring-amarelo min-[640px]:order-2 min-[640px]:h-full min-[640px]:w-48 min-[640px]:border-b-0 min-[640px]:border-l"
        aria-label={`Ver detalhes de ${produto.nome}`}
      >
        {imagem ? (
          <img
            src={imagem}
            alt={produto.nome}
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105 group-hover:brightness-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-preto-v3 font-barlow-condensed text-2xl font-black uppercase text-amarelo">
            Paraíba
          </div>
        )}
      </button>
    </article>
  );
}

function DetalheProdutoAdm({
  produto,
  onClose,
  onEdit,
  onDelete,
}: {
  produto: ProdutoCardapio;
  onClose: () => void;
  onEdit: (produto: ProdutoCardapio) => void;
  onDelete: (produto: ProdutoCardapio) => void;
}) {
  const imagem = produto.imagemLocal ?? produto.imagem_url ?? "";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end bg-preto-v1/80 px-4 py-4 backdrop-blur-sm min-[640px]:items-center min-[640px]:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="produto-adm-detalhe-titulo"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[5px] bg-[#222] text-branco shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid min-[768px]:grid-cols-[minmax(0,0.95fr)_minmax(20rem,1fr)]">
          <div className="aspect-square overflow-hidden bg-preto-v3 min-[768px]:aspect-auto min-[768px]:h-[28rem]">
            {imagem ? (
              <img
                src={imagem}
                alt={produto.nome}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-barlow-condensed text-4xl font-black uppercase text-amarelo">
                Paraíba
              </div>
            )}
          </div>

          <div className="flex flex-col p-5 min-[640px]:p-6">
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-barlow-condensed text-lg font-black uppercase text-amarelo">
                  Cardápio ADM
                </p>
                <h3
                  id="produto-adm-detalhe-titulo"
                  className="mt-1 font-barlow text-3xl font-black leading-none text-branco"
                >
                  {produto.nome}
                </h3>
              </div>

              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] border border-branco/15 text-branco transition-colors hover:border-amarelo hover:text-amarelo"
                onClick={onClose}
                aria-label="Fechar detalhes"
              >
                <X aria-hidden className="h-5 w-5" strokeWidth={3} />
              </button>
            </div>

            <p className="mt-4 font-barlow text-sm leading-snug text-branco/85">
              {produto.descricao}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {produto.variacoes.map((variacao) => (
                <div
                  key={variacao.id}
                  className="rounded-[5px] border border-branco/15 px-4 py-3"
                >
                  <p className="font-barlow text-xs font-semibold uppercase text-branco/55">
                    {variacao.nome}
                  </p>
                  <p className="font-barlow-condensed text-2xl font-black leading-none text-branco">
                    {formatarPreco(variacao.preco)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h4 className="font-barlow-condensed text-2xl font-black uppercase text-amarelo">
                Adicionais
              </h4>

              {produto.adicionais.length > 0 ? (
                <ul className="mt-3 grid gap-2">
                  {produto.adicionais.map((adicional) => (
                    <li
                      key={adicional.id}
                      className="flex items-center justify-between gap-4 rounded-[5px] border border-branco/10 px-3 py-2 font-barlow text-sm"
                    >
                      <span className="min-w-0 text-branco/90">
                        {adicional.nome}
                      </span>
                      <span className="shrink-0 font-barlow-condensed text-xl font-black text-branco">
                        {formatarPreco(adicional.preco)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 font-barlow text-sm text-branco/65">
                  Nenhum adicional cadastrado para este item.
                </p>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onEdit(produto)}
                className="inline-flex items-center justify-center gap-2 rounded-[5px] bg-amarelo px-4 py-2 font-barlow-condensed text-lg font-black uppercase text-preto-v1"
              >
                <Edit2 aria-hidden className="h-4 w-4" strokeWidth={3} />
                Editar
              </button>
              <button
                type="button"
                onClick={() => onDelete(produto)}
                className="inline-flex items-center justify-center gap-2 rounded-[5px] bg-red-600 px-4 py-2 font-barlow-condensed text-lg font-black uppercase text-branco"
              >
                <Trash2 aria-hidden className="h-4 w-4" strokeWidth={3} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecaoProdutosAdm({
  secao,
  onViewProduto,
  onEditProduto,
  onDeleteProduto,
  ativa,
}: {
  secao: SecaoCardapio;
  onViewProduto: (produto: ProdutoCardapio) => void;
  onEditProduto: (produto: ProdutoCardapio) => void;
  onDeleteProduto: (produto: ProdutoCardapio) => void;
  ativa: boolean;
}) {
  return (
    <section id={secao.id} className="scroll-mt-36 pt-14 first:pt-12">
      <h2
        className={`font-barlow-condensed text-[clamp(2rem,8vw,3.5rem)] font-black uppercase leading-none transition-colors ${
          ativa ? "text-amarelo" : "text-branco"
        }`}
      >
        {secao.titulo}
      </h2>

      {secao.produtos.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 pb-5 min-[900px]:grid-cols-2 min-[1180px]:grid-cols-3">
          {secao.produtos.map((produto) => (
            <CardProdutoAdm
              key={produto.id}
              produto={produto}
              onView={onViewProduto}
              onEdit={onEditProduto}
              onDelete={onDeleteProduto}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[12px] border border-branco/10 bg-[#222] px-4 py-5 font-barlow text-sm text-branco/60">
          Categoria cadastrada sem itens. Adicione um produto para exibi-lo aqui.
        </div>
      )}
    </section>
  );
}

function ProdutoFormModal({
  categorias,
  subcategorias,
  unidades,
  produto,
  onClose,
  onSave,
}: {
  categorias: CategoriaRead[];
  subcategorias: SubcategoriaRead[];
  unidades: UnidadeRead[];
  produto: ProdutoCardapio | null;
  onClose: () => void;
  onSave: (form: ProdutoFormData) => void;
}) {
  const primeiraSubcategoria = subcategorias[0]?.id ?? 1;
  const [form, setForm] = useState(() =>
    produtoParaForm(produto, primeiraSubcategoria),
  );
  const [salvando, setSalvando] = useState(false);

  const updateField = (
    field: keyof ProdutoFormData,
    value: string | number,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const adicionarAdicional = () => {
    setForm((current) => ({
      ...current,
      adicionais: [
        ...current.adicionais,
        { id: crypto.randomUUID(), nome: "", preco: "" },
      ],
    }));
  };

  const atualizarAdicional = (
    id: string,
    field: keyof Omit<ProdutoFormAdicional, "id">,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      adicionais: current.adicionais.map((adicional) =>
        adicional.id === id ? { ...adicional, [field]: value } : adicional,
      ),
    }));
  };

  const removerAdicional = (id: string) => {
    setForm((current) => ({
      ...current,
      adicionais: current.adicionais.filter((adicional) => adicional.id !== id),
    }));
  };

  const alternarUnidade = (unidadeId: number) => {
    setForm((current) => ({
      ...current,
      unidadeIds: current.unidadeIds.includes(unidadeId)
        ? current.unidadeIds.filter((id) => id !== unidadeId)
        : [...current.unidadeIds, unidadeId],
    }));
  };

  const imagemPreview = form.imagemLocal || form.imagemUrl;
  const nomeArquivoImagem = form.imagemArquivo?.name ?? "Nenhum arquivo selecionado";

  const handleArquivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0] ?? null;
    if (!arquivo) {
      setForm((current) => ({
        ...current,
        imagemArquivo: null,
        imagemLocal: "",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        imagemArquivo: arquivo,
        imagemLocal: String(reader.result),
      }));
    };
    reader.readAsDataURL(arquivo);
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      await onSave(form);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className={modalOverlayClass}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`${modalFormPanelClass} max-w-3xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#DADEE3] pb-4">
          <div className="min-w-0 flex-1 text-center">
            <h3 className={modalTitleClass}>
              {produto ? "Editar Produto" : "Novo Produto"}
            </h3>
            <p className={modalSubtitleClass}>
              Preencha as informações do item do cardápio.
            </p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] border border-[#DADEE3] text-[#121212] transition-colors hover:border-amarelo hover:text-amarelo"
            onClick={onClose}
            aria-label="Fechar formulário"
          >
            <X aria-hidden className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 font-barlow">
          <label>
            <span className={modalLabelClass}>Categoria</span>
            <select
              value={form.subcategoriaId}
              onChange={(event) =>
                updateField("subcategoriaId", Number(event.target.value))
              }
              className={modalInputClass}
            >
              {subcategorias.map((subcategoria) => {
                const categoria = categorias.find(
                  (item) => item.id === subcategoria.categoria_id,
                );
                return (
                  <option key={subcategoria.id} value={subcategoria.id}>
                    {categoria ? `${categoria.nome} / ` : ""}
                    {subcategoria.nome}
                  </option>
                );
              })}
            </select>
          </label>

          <label>
            <span className={modalLabelClass}>Nome</span>
            <input
              value={form.nome}
              onChange={(event) => updateField("nome", event.target.value)}
              className={modalInputClass}
            />
          </label>

          <label>
            <span className={modalLabelClass}>Descrição</span>
            <textarea
              value={form.descricao}
              onChange={(event) => updateField("descricao", event.target.value)}
              className={`${modalInputClass} min-h-28`}
            />
          </label>

          <label>
            <span className={modalLabelClass}>URL da imagem</span>
            <input
              value={form.imagemUrl}
              onChange={(event) => updateField("imagemUrl", event.target.value)}
              className={modalInputClass}
            />
          </label>

          <label>
            <span className={modalLabelClass}>Arquivo</span>
            <div className="mt-1 flex flex-col gap-2 rounded-[5px] border border-[#DADEE3] bg-[rgba(244,246,248,0.4)] px-3 py-2 min-[520px]:flex-row min-[520px]:items-center">
              <span className="inline-flex w-fit cursor-pointer items-center justify-center rounded-[5px] bg-[#0A0A0A] px-3 py-1.5 font-barlow-condensed text-base font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#2C2C2C]">
                Escolher arquivo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleArquivo}
                  className="sr-only"
                />
              </span>
              <span className="min-w-0 truncate font-barlow-condensed text-base text-[#121212]">
                {nomeArquivoImagem}
              </span>
            </div>
          </label>

          {imagemPreview && (
            <div className="rounded-[5px] border border-[#DADEE3] bg-[rgba(244,246,248,0.4)] p-3">
              <span className="font-barlow text-sm font-semibold text-[#121212]">
                Pré-visualização
              </span>
              <div className="mt-2 h-44 overflow-hidden rounded-[15px] bg-[#F4F4F4]">
                <img
                  src={imagemPreview}
                  alt="Pré-visualização do item"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 min-[640px]:grid-cols-2">
            <label>
              <span className={modalLabelClass}>Pontos fidelidade</span>
              <input
                type="number"
                min={0}
                value={form.pontosFidelidadePorUnidade}
                onChange={(event) =>
                  updateField(
                    "pontosFidelidadePorUnidade",
                    event.target.value,
                  )
                }
                className={modalInputClass}
              />
            </label>
            <label className="flex items-center gap-3 rounded-[5px] border border-[#DADEE3] bg-[rgba(244,246,248,0.4)] px-3 py-2">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    ativo: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-amarelo"
              />
              <span className="text-sm font-semibold text-[#121212]">
                Produto ativo
              </span>
            </label>
          </div>

          <div className="rounded-[5px] border border-[#DADEE3] bg-[rgba(244,246,248,0.4)] p-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.disponivelTodasUnidades}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    disponivelTodasUnidades: event.target.checked,
                    unidadeIds: event.target.checked ? [] : current.unidadeIds,
                  }))
                }
                className="h-4 w-4 accent-amarelo"
              />
              <span className="text-sm font-semibold text-[#121212]">
                Disponível em todas as unidades
              </span>
            </label>

            {!form.disponivelTodasUnidades && (
              <div className="mt-3 grid gap-2">
                {unidades.length > 0 ? (
                  unidades.map((unidade) => (
                    <label
                      key={unidade.id}
                      className="flex items-center gap-3 rounded-[5px] border border-[#DADEE3] bg-white px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={form.unidadeIds.includes(unidade.id)}
                        onChange={() => alternarUnidade(unidade.id)}
                        className="h-4 w-4 accent-amarelo"
                      />
                      <span className="font-barlow text-sm text-[#121212]">
                        {unidade.nome}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="font-barlow text-sm text-[#666666]">
                    Nenhuma unidade carregada.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 min-[640px]:grid-cols-2">
            <label>
              <span className={modalLabelClass}>Preço normal</span>
              <input
                value={form.preco}
                onChange={(event) => updateField("preco", event.target.value)}
                className={modalInputClass}
              />
            </label>
            <label>
              <span className={modalLabelClass}>Preço combo</span>
              <input
                value={form.precoCombo}
                onChange={(event) =>
                  updateField("precoCombo", event.target.value)
                }
                className={modalInputClass}
              />
            </label>
          </div>

          <div className="rounded-[5px] border border-[#DADEE3] bg-[rgba(244,246,248,0.4)] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className={modalLabelClass}>
                Adicionais
              </span>
              <button
                type="button"
                onClick={adicionarAdicional}
                className="inline-flex items-center gap-2 rounded-[6px] bg-[#0A0A0A] px-3 py-1.5 font-barlow-condensed text-base font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#2C2C2C]"
              >
                <Plus aria-hidden className="h-4 w-4" strokeWidth={3} />
                Adicionar
              </button>
            </div>

            {form.adicionais.length > 0 ? (
              <div className="mt-3 grid gap-3">
                {form.adicionais.map((adicional) => (
                  <div
                    key={adicional.id}
                    className="grid gap-2 rounded-[5px] border border-[#DADEE3] bg-white p-3 min-[640px]:grid-cols-[minmax(0,1fr)_8rem_2.5rem] min-[640px]:items-end"
                  >
                    <label>
                      <span className="text-xs font-semibold uppercase text-[#666666]">
                        Nome
                      </span>
                      <input
                        value={adicional.nome}
                        onChange={(event) =>
                          atualizarAdicional(
                            adicional.id,
                            "nome",
                            event.target.value,
                          )
                        }
                        className={modalInputClass}
                      />
                    </label>

                    <label>
                      <span className="text-xs font-semibold uppercase text-[#666666]">
                        Preço
                      </span>
                      <input
                        value={adicional.preco}
                        onChange={(event) =>
                          atualizarAdicional(
                            adicional.id,
                            "preco",
                            event.target.value,
                          )
                        }
                        className={modalInputClass}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => removerAdicional(adicional.id)}
                      className="flex h-10 items-center justify-center gap-2 rounded-[6px] bg-[#D92B2B] px-3 font-barlow-condensed text-base font-semibold uppercase tracking-wide text-white transition-colors hover:bg-red-700 min-[640px]:w-10 min-[640px]:px-0"
                      aria-label={`Excluir adicional ${adicional.nome || ""}`}
                    >
                      <Trash2
                        aria-hidden
                        className="h-4 w-4"
                        strokeWidth={2.5}
                      />
                      <span className="min-[640px]:sr-only">Excluir</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 font-barlow text-sm text-[#666666]">
                Nenhum adicional cadastrado.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#DADEE3] pt-4">
          <button
            type="button"
            onClick={onClose}
            className={modalSecondaryButtonClass}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvar}
            className={modalPrimaryButtonClass}
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoriaFormModal({
  categoria,
  onClose,
  onSave,
}: {
  categoria: CategoriaRead | null;
  onClose: () => void;
  onSave: (form: CategoriaFormData) => void;
}) {
  const [nome, setNome] = useState(categoria?.nome ?? "");
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    setSalvando(true);
    try {
      await onSave({ nome });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className={modalOverlayClass}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={modalCompactPanelClass}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#DADEE3] pb-4">
          <div className="min-w-0 flex-1 text-center">
            <h3 className={modalTitleClass}>
              {categoria ? "Editar categoria" : "Nova categoria"}
            </h3>
            <p className={modalSubtitleClass}>
              Preencha as informações da categoria.
            </p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] border border-[#DADEE3] text-[#121212] transition-colors hover:border-amarelo hover:text-amarelo"
            onClick={onClose}
            aria-label="Fechar formulário"
          >
            <X aria-hidden className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>

        <label className="mt-6 block font-barlow">
          <span className={modalLabelClass}>Nome</span>
          <input
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            className={modalInputClass}
          />
        </label>

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#DADEE3] pt-4">
          <button
            type="button"
            onClick={onClose}
            className={modalSecondaryButtonClass}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvar}
            className={modalPrimaryButtonClass}
            disabled={salvando || !nome.trim()}
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubcategoriaFormModal({
  categorias,
  subcategoria,
  onClose,
  onSave,
}: {
  categorias: CategoriaRead[];
  subcategoria: SubcategoriaRead | null;
  onClose: () => void;
  onSave: (form: SubcategoriaFormData) => void;
}) {
  const [form, setForm] = useState<SubcategoriaFormData>({
    nome: subcategoria?.nome ?? "",
    categoriaId: subcategoria?.categoria_id ?? categorias[0]?.id ?? 0,
  });
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    setSalvando(true);
    try {
      await onSave(form);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className={modalOverlayClass}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={modalCompactPanelClass}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#DADEE3] pb-4">
          <div className="min-w-0 flex-1 text-center">
            <h3 className={modalTitleClass}>
              {subcategoria ? "Editar subcategoria" : "Nova subcategoria"}
            </h3>
            <p className={modalSubtitleClass}>
              Preencha as informações da subcategoria.
            </p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] border border-[#DADEE3] text-[#121212] transition-colors hover:border-amarelo hover:text-amarelo"
            onClick={onClose}
            aria-label="Fechar formulário"
          >
            <X aria-hidden className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 font-barlow">
          <label>
            <span className={modalLabelClass}>Nome</span>
            <input
              value={form.nome}
              onChange={(event) =>
                setForm((current) => ({ ...current, nome: event.target.value }))
              }
              className={modalInputClass}
            />
          </label>

          <label>
            <span className={modalLabelClass}>Categoria</span>
            <select
              value={form.categoriaId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  categoriaId: Number(event.target.value),
                }))
              }
              className={modalInputClass}
            >
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#DADEE3] pt-4">
          <button
            type="button"
            onClick={onClose}
            className={modalSecondaryButtonClass}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvar}
            className={modalPrimaryButtonClass}
            disabled={salvando || !form.nome.trim() || !form.categoriaId}
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GerenciadorTaxonomia({
  categorias,
  subcategorias,
  onNovaCategoria,
  onEditarCategoria,
  onExcluirCategoria,
  onMoverCategoria,
  onNovaSubcategoria,
  onEditarSubcategoria,
  onExcluirSubcategoria,
}: {
  categorias: CategoriaRead[];
  subcategorias: SubcategoriaRead[];
  onNovaCategoria: () => void;
  onEditarCategoria: (categoria: CategoriaRead) => void;
  onExcluirCategoria: (categoria: CategoriaRead) => void;
  onMoverCategoria: (categoriaId: number, direcao: -1 | 1) => void;
  onNovaSubcategoria: () => void;
  onEditarSubcategoria: (subcategoria: SubcategoriaRead) => void;
  onExcluirSubcategoria: (subcategoria: SubcategoriaRead) => void;
}) {
  return (
    <div className="mt-8 grid gap-4 rounded-[5px] border border-branco/10 bg-[#222] p-4 min-[900px]:grid-cols-2">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-barlow-condensed text-2xl font-black uppercase text-amarelo">
            Categorias
          </h2>
          <button
            type="button"
            onClick={onNovaCategoria}
            className="inline-flex items-center gap-2 rounded-[5px] bg-amarelo px-3 py-1.5 font-barlow-condensed text-base font-black uppercase text-preto-v1"
          >
            <Plus aria-hidden className="h-4 w-4" strokeWidth={3} />
            Nova
          </button>
        </div>

        <div className="mt-3 grid gap-2">
          {categorias.map((categoria, index) => (
            <div
              key={categoria.id}
              className="flex items-center justify-between gap-3 rounded-[5px] border border-branco/10 bg-preto-v3 px-3 py-2"
            >
              <span className="min-w-0 font-barlow text-sm font-semibold text-branco">
                {categoria.nome}
              </span>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onMoverCategoria(categoria.id, -1)}
                  className="flex h-9 w-9 items-center justify-center rounded-[5px] border border-branco/10 text-branco transition-colors hover:border-amarelo hover:text-amarelo disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label={`Mover categoria ${categoria.nome} para cima`}
                  disabled={index === 0}
                >
                  <ArrowUp aria-hidden className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => onMoverCategoria(categoria.id, 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-[5px] border border-branco/10 text-branco transition-colors hover:border-amarelo hover:text-amarelo disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label={`Mover categoria ${categoria.nome} para baixo`}
                  disabled={index === categorias.length - 1}
                >
                  <ArrowDown
                    aria-hidden
                    className="h-4 w-4"
                    strokeWidth={2.5}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onEditarCategoria(categoria)}
                  className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-branco text-preto-v1 transition-colors hover:bg-amarelo"
                  aria-label={`Editar categoria ${categoria.nome}`}
                >
                  <Edit2 aria-hidden className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => onExcluirCategoria(categoria)}
                  className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-red-600 text-branco transition-opacity hover:opacity-85"
                  aria-label={`Excluir categoria ${categoria.nome}`}
                >
                  <Trash2 aria-hidden className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-barlow-condensed text-2xl font-black uppercase text-amarelo">
            Subcategorias
          </h2>
          <button
            type="button"
            onClick={onNovaSubcategoria}
            className="inline-flex items-center gap-2 rounded-[5px] bg-amarelo px-3 py-1.5 font-barlow-condensed text-base font-black uppercase text-preto-v1"
          >
            <Plus aria-hidden className="h-4 w-4" strokeWidth={3} />
            Nova
          </button>
        </div>

        <div className="mt-3 grid gap-2">
          {subcategorias.map((subcategoria) => {
            const categoria = categorias.find(
              (item) => item.id === subcategoria.categoria_id,
            );
            return (
              <div
                key={subcategoria.id}
                className="flex items-center justify-between gap-3 rounded-[5px] border border-branco/10 bg-preto-v3 px-3 py-2"
              >
                <div className="min-w-0">
                  <span className="block truncate font-barlow text-sm font-semibold text-branco">
                    {subcategoria.nome}
                  </span>
                  <span className="block truncate font-barlow text-xs text-branco/55">
                    {categoria?.nome ?? "Categoria não encontrada"}
                  </span>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => onEditarSubcategoria(subcategoria)}
                    className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-branco text-preto-v1 transition-colors hover:bg-amarelo"
                    aria-label={`Editar subcategoria ${subcategoria.nome}`}
                  >
                    <Edit2 aria-hidden className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onExcluirSubcategoria(subcategoria)}
                    className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-red-600 text-branco transition-opacity hover:opacity-85"
                    aria-label={`Excluir subcategoria ${subcategoria.nome}`}
                  >
                    <Trash2 aria-hidden className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ConfirmarExclusao({
  produto,
  onCancel,
  onConfirm,
}: {
  produto: ProdutoCardapio;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[420px] overflow-hidden rounded-[12px] bg-white text-[#0A0A0A] shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 bg-[#0A0A0A] px-6 py-5 text-white">
          <h3 className="min-w-0 flex-1 text-center font-barlow-condensed text-[28px] font-semibold uppercase leading-none tracking-[1px]">
            Excluir item
          </h3>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-white/20 text-white transition-colors hover:border-amarelo hover:text-amarelo"
            onClick={onCancel}
            aria-label="Fechar confirmação"
          >
            <X aria-hidden className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>
        <div className="px-6 py-6">
          <p className="font-barlow text-base font-bold text-[#0A0A0A]">
            Confirmar exclusão:
          </p>
          <p className="mt-2 font-barlow text-sm text-[#666666]">
            Remover "{produto.nome}" do cardápio?
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 px-6 pb-6 min-[420px]:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className={modalSecondaryButtonClass}
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={modalDangerButtonClass}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmarExclusaoTaxonomia({
  titulo,
  nome,
  onCancel,
  onConfirm,
}: {
  titulo: string;
  nome: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[420px] overflow-hidden rounded-[12px] bg-white text-[#0A0A0A] shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 bg-[#0A0A0A] px-6 py-5 text-white">
          <h3 className="min-w-0 flex-1 text-center font-barlow-condensed text-[28px] font-semibold uppercase leading-none tracking-[1px]">
            {titulo}
          </h3>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-white/20 text-white transition-colors hover:border-amarelo hover:text-amarelo"
            onClick={onCancel}
            aria-label="Fechar confirmação"
          >
            <X aria-hidden className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>
        <div className="px-6 py-6">
          <p className="font-barlow text-base font-bold text-[#0A0A0A]">
            Confirmar exclusão:
          </p>
          <p className="mt-2 font-barlow text-sm text-[#666666]">
            Remover "{nome}" do cardápio?
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 px-6 pb-6 min-[420px]:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className={modalSecondaryButtonClass}
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={modalDangerButtonClass}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 2500);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[90] max-w-sm rounded-[5px] bg-amarelo px-4 py-3 font-barlow font-semibold text-preto-v1 shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
      {message}
    </div>
  );
}

export default function CardapioAdm() {
  const [secoes, setSecoes] = useState<SecaoCardapio[]>([]);
  const [categorias, setCategorias] = useState<CategoriaRead[]>([]);
  const [subcategorias, setSubcategorias] = useState<SubcategoriaRead[]>([]);
  const [unidades, setUnidades] = useState<UnidadeRead[]>([]);
  const [unidadeSelecionadaId, setUnidadeSelecionadaId] = useState<number | "">(
    "",
  );
  const [carregando, setCarregando] = useState(true);
  const [produtoSelecionado, setProdutoSelecionado] =
    useState<ProdutoCardapio | null>(null);
  const [produtoEditando, setProdutoEditando] =
    useState<ProdutoCardapio | null>(null);
  const [produtoExcluindo, setProdutoExcluindo] =
    useState<ProdutoCardapio | null>(null);
  const [categoriaEditando, setCategoriaEditando] =
    useState<CategoriaRead | null>(null);
  const [categoriaExcluindo, setCategoriaExcluindo] =
    useState<CategoriaRead | null>(null);
  const [subcategoriaEditando, setSubcategoriaEditando] =
    useState<SubcategoriaRead | null>(null);
  const [subcategoriaExcluindo, setSubcategoriaExcluindo] =
    useState<SubcategoriaRead | null>(null);
  const [mostrarCriacao, setMostrarCriacao] = useState(false);
  const [mostrarCategoriaCriacao, setMostrarCategoriaCriacao] = useState(false);
  const [mostrarSubcategoriaCriacao, setMostrarSubcategoriaCriacao] =
    useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [secaoAtivaId, setSecaoAtivaId] = useState(() =>
    window.location.hash.replace("#", ""),
  );

  const carregarDados = async () => {
    const [
      secoesAtualizadas,
      categoriasAtualizadas,
      subcategoriasAtualizadas,
      unidadesAtualizadas,
    ] = await Promise.all([
      listarSecoesCardapio(unidadeSelecionadaId || null, true, true),
      listarCategoriasCardapio(),
      listarSubcategoriasCardapio(),
      apiJson<UnidadeRead[]>("/unidades/"),
    ]);

    setSecoes(secoesAtualizadas);
    setCategorias(categoriasAtualizadas);
    setSubcategorias(subcategoriasAtualizadas);
    setUnidades(unidadesAtualizadas);
  };

  useEffect(() => {
    let ativo = true;

    Promise.all([
      listarSecoesCardapio(unidadeSelecionadaId || null, true, true),
      listarCategoriasCardapio(),
      listarSubcategoriasCardapio(),
      apiJson<UnidadeRead[]>("/unidades/"),
    ])
      .then(
        ([
          secoesAtualizadas,
          categoriasAtualizadas,
          subcategoriasAtualizadas,
          unidadesAtualizadas,
        ]) => {
          if (!ativo) return;
          setSecoes(secoesAtualizadas);
          setCategorias(categoriasAtualizadas);
          setSubcategorias(subcategoriasAtualizadas);
          setUnidades(unidadesAtualizadas);
        },
      )
      .catch(() => {
        if (ativo) {
          setToast("Não foi possível carregar todo o cardápio.");
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [unidadeSelecionadaId]);

  useEffect(() => {
    if (!secoes.length) return;

    const atualizarSecaoAtiva = () => {
      const pontoAtivo = window.scrollY + 180;
      let secaoAtual = secoes[0]?.id ?? "";

      secoes.forEach((secao) => {
        const elemento = document.getElementById(secao.id);
        if (!elemento) return;

        if (elemento.offsetTop <= pontoAtivo) {
          secaoAtual = secao.id;
        }
      });

      setSecaoAtivaId(secaoAtual);
    };

    let frameId = 0;
    const reagirAoScroll = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(atualizarSecaoAtiva);
    };

    atualizarSecaoAtiva();
    window.addEventListener("scroll", reagirAoScroll, { passive: true });
    window.addEventListener("resize", reagirAoScroll);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", reagirAoScroll);
      window.removeEventListener("resize", reagirAoScroll);
    };
  }, [secoes]);

  const secaoAtivaExibida = secaoAtivaId || secoes[0]?.id || "";

  const totalProdutos = useMemo(
    () => secoes.reduce((total, secao) => total + secao.produtos.length, 0),
    [secoes],
  );
  const unidadeSelecionada = useMemo(
    () =>
      unidades.find((unidade) => unidade.id === unidadeSelecionadaId) ?? null,
    [unidadeSelecionadaId, unidades],
  );

  const primeiraSubcategoria =
    subcategorias[0]?.id ?? secoes[0]?.produtos[0]?.subcategoria_id ?? 1;

  const atualizarProdutoLocal = (produtoAtualizado: ProdutoCardapio) => {
    setSecoes((current) =>
      current.map((secao) => {
        const pertenceASecao =
          secao.produtos[0]?.subcategoria_id ===
          produtoAtualizado.subcategoria_id;
        const produtosSemAtual = secao.produtos.filter(
          (produto) => produto.id !== produtoAtualizado.id,
        );

        return {
          ...secao,
          produtos: pertenceASecao
            ? [...produtosSemAtual, produtoAtualizado]
            : produtosSemAtual,
        };
      }),
    );
  };

  const criarProdutoLocal = (produto: ProdutoCardapio) => {
    setSecoes((current) =>
      current.map((secao) =>
        secao.produtos[0]?.subcategoria_id === produto.subcategoria_id
          ? { ...secao, produtos: [...secao.produtos, produto] }
          : secao,
      ),
    );
  };

  const removerProdutoLocal = (produtoId: number) => {
    setSecoes((current) =>
      current.map((secao) => ({
        ...secao,
        produtos: secao.produtos.filter((produto) => produto.id !== produtoId),
      })),
    );
  };

  const salvarProduto = async (
    form: ProdutoFormData,
    produto?: ProdutoCardapio,
  ) => {
    if (!form.disponivelTodasUnidades && form.unidadeIds.length === 0) {
      setToast("Selecione ao menos uma unidade para produto restrito.");
      return;
    }

    const idTemporario =
      produto?.id ??
      Math.max(
        0,
        ...secoes.flatMap((secao) => secao.produtos.map((item) => item.id)),
      ) + 1;
    const formFinal = { ...form };

    const payload = {
      nome: form.nome,
      descricao: form.descricao,
      imagem_url: formFinal.imagemUrl || null,
      ativo: form.ativo,
      pontos_fidelidade_por_unidade: Number(
        form.pontosFidelidadePorUnidade || 0,
      ),
      disponivel_todas_unidades: form.disponivelTodasUnidades,
      subcategoria_id: form.subcategoriaId,
      unidade_ids: form.disponivelTodasUnidades ? [] : form.unidadeIds,
    };

    let idPersistido = idTemporario;

    try {
      const body =
        formFinal.imagemArquivo
          ? criarProdutoMultipartPayload(formFinal, formFinal.imagemArquivo)
          : JSON.stringify(payload);

      const produtoSalvo = await apiJson<ProdutoCardapio>(
        produto ? `/produtos/${produto.id}` : "/produtos/",
        {
          method: produto ? "PATCH" : "POST",
          body,
        },
      );

      idPersistido = produtoSalvo.id;
      await sincronizarVariacoes(idPersistido, formFinal, produto);
      await sincronizarAdicionais(idPersistido, formFinal, produto);
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o produto.",
      );
      return;
    }

    let produtoAtualizado = produtoFromForm(idPersistido, formFinal, produto);

    try {
      produtoAtualizado = normalizarProdutoBackend(
        await apiJson<ProdutoCardapio>(`/produtos/${idPersistido}`),
      );
      if (formFinal.imagemLocal && !formFinal.imagemUrl) {
        produtoAtualizado.imagemLocal = formFinal.imagemLocal;
      }
    } catch {
      produtoAtualizado = produtoFromForm(idPersistido, formFinal, produto);
    }

    if (produto) {
      atualizarProdutoLocal(produtoAtualizado);
      setProdutoSelecionado((current) =>
        current?.id === produtoAtualizado.id ? produtoAtualizado : current,
      );
      setProdutoEditando(null);
    } else {
      criarProdutoLocal(produtoAtualizado);
      setMostrarCriacao(false);
    }

    await carregarDados();

    setToast(
      produto
        ? "Produto atualizado."
        : "Produto criado.",
    );
  };

  const confirmarExclusao = async () => {
    if (!produtoExcluindo) return;

    try {
      await apiJson<void>(`/produtos/${produtoExcluindo.id}`, {
        method: "DELETE",
      });
      setToast("Produto excluído.");
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o produto.",
      );
      return;
    }

    removerProdutoLocal(produtoExcluindo.id);
    setProdutoSelecionado((current) =>
      current?.id === produtoExcluindo.id ? null : current,
    );
    setProdutoExcluindo(null);
  };

  const salvarCategoria = async (
    form: CategoriaFormData,
    categoria?: CategoriaRead,
  ) => {
    try {
      await apiJson<CategoriaRead>(
        categoria
          ? `/produtos/categorias/${categoria.id}`
          : "/produtos/categorias",
        {
          method: categoria ? "PATCH" : "POST",
          body: JSON.stringify({ nome: form.nome.trim() }),
        },
      );
      setMostrarCategoriaCriacao(false);
      setCategoriaEditando(null);
      await carregarDados();
      setToast(categoria ? "Categoria atualizada." : "Categoria criada.");
    } catch {
      setToast("Não foi possível salvar a categoria.");
    }
  };

  const excluirCategoria = async () => {
    if (!categoriaExcluindo) return;

    try {
      await apiJson<void>(`/produtos/categorias/${categoriaExcluindo.id}`, {
        method: "DELETE",
      });
      setCategoriaExcluindo(null);
      await carregarDados();
      setToast("Categoria excluída.");
    } catch {
      setToast("Não foi possível excluir a categoria. Verifique vínculos.");
    }
  };

  const salvarSubcategoria = async (
    form: SubcategoriaFormData,
    subcategoria?: SubcategoriaRead,
  ) => {
    try {
      await apiJson<SubcategoriaRead>(
        subcategoria
          ? `/produtos/subcategorias/${subcategoria.id}`
          : "/produtos/subcategorias",
        {
          method: subcategoria ? "PATCH" : "POST",
          body: JSON.stringify({
            nome: form.nome.trim(),
            categoria_id: form.categoriaId,
          }),
        },
      );
      setMostrarSubcategoriaCriacao(false);
      setSubcategoriaEditando(null);
      await carregarDados();
      setToast(
        subcategoria ? "Subcategoria atualizada." : "Subcategoria criada.",
      );
    } catch {
      setToast("Não foi possível salvar a subcategoria.");
    }
  };

  const excluirSubcategoria = async () => {
    if (!subcategoriaExcluindo) return;

    try {
      await apiJson<void>(
        `/produtos/subcategorias/${subcategoriaExcluindo.id}`,
        {
          method: "DELETE",
        },
      );
      setSubcategoriaExcluindo(null);
      await carregarDados();
      setToast("Subcategoria excluída.");
    } catch {
      setToast("Não foi possível excluir a subcategoria. Verifique vínculos.");
    }
  };

  const moverCategoria = (categoriaId: number, direcao: -1 | 1) => {
    setCategorias((current) => {
      const indiceAtual = current.findIndex(
        (categoria) => categoria.id === categoriaId,
      );
      const novoIndice = indiceAtual + direcao;

      if (
        indiceAtual === -1 ||
        novoIndice < 0 ||
        novoIndice >= current.length
      ) {
        return current;
      }

      const ordenadas = [...current];
      const [categoriaMovida] = ordenadas.splice(indiceAtual, 1);
      ordenadas.splice(novoIndice, 0, categoriaMovida);
      salvarOrdemCategorias(ordenadas);
      setSecoes((secoesAtuais) => ordenarSecoesCardapio(secoesAtuais));
      setToast("Ordem das categorias atualizada.");

      return ordenadas;
    });
  };

  return (
    <>
      <BarraDeNavegacaoAdmin />

      <main
        className={`${CLASSE_OFFSET_BARRA_ADMIN} min-h-screen overflow-x-clip bg-preto-v1 text-branco`}
      >
        <section className="pagina-container pt-12 pb-16 min-[768px]:pt-16">
          <div className="max-w-4xl">
            <p className="font-barlow text-sm font-semibold uppercase text-amarelo">
              Paraíba Hot Dog
            </p>
            <h1 className="mt-3 font-barlow-condensed text-[clamp(3rem,15vw,7rem)] font-black uppercase leading-[0.85] text-branco">
              Cardápio
            </h1>
            <p className="mt-5 max-w-2xl font-barlow-condensed text-2xl font-semibold leading-tight text-branco/85 min-[640px]:text-3xl">
              Smashdogs, hotdogs, bebidas e acompanhamentos com o tempero mais
              arretado de Brasília.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={() => setMostrarCriacao(true)}
              className="inline-flex items-center gap-2 rounded-[5px] bg-amarelo px-4 py-2 font-barlow-condensed text-lg font-black uppercase text-preto-v1 transition-opacity hover:opacity-90"
              disabled={subcategorias.length === 0}
            >
              <Plus aria-hidden className="h-4 w-4" strokeWidth={3} />
              Novo item
            </button>

            <div className="min-w-64 font-barlow">
              <label
                htmlFor="unidade-cardapio-admin"
                className="block text-xs font-semibold uppercase text-branco/65"
              >
                Unidade
              </label>
              <select
                id="unidade-cardapio-admin"
                value={unidadeSelecionadaId}
                onChange={(event) => {
                  setCarregando(true);
                  setProdutoSelecionado(null);
                  setProdutoEditando(null);
                  setProdutoExcluindo(null);
                  setUnidadeSelecionadaId(
                    event.target.value ? Number(event.target.value) : "",
                  );
                }}
                className="mt-1 h-10 w-full rounded-[5px] border border-branco/15 bg-[#222] px-3 font-barlow text-sm font-semibold text-branco outline-none transition-colors focus:border-amarelo focus:ring-2 focus:ring-amarelo/30"
              >
                <option value="">Todas as unidades</option>
                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>
                    {unidade.nome}
                  </option>
                ))}
              </select>
            </div>

            <p className="font-barlow text-sm text-branco/60">
              {totalProdutos} itens disponíveis
              {unidadeSelecionada ? ` em ${unidadeSelecionada.nome}` : ""}.
            </p>
          </div>

          <GerenciadorTaxonomia
            categorias={categorias}
            subcategorias={subcategorias}
            onNovaCategoria={() => setMostrarCategoriaCriacao(true)}
            onEditarCategoria={setCategoriaEditando}
            onExcluirCategoria={setCategoriaExcluindo}
            onMoverCategoria={moverCategoria}
            onNovaSubcategoria={() => setMostrarSubcategoriaCriacao(true)}
            onEditarSubcategoria={setSubcategoriaEditando}
            onExcluirSubcategoria={setSubcategoriaExcluindo}
          />

          {!carregando && (
            <div className="mt-10">
              <NavegacaoCategorias categorias={categorias} />
            </div>
          )}

          {carregando ? (
            <div className="mt-12 rounded-[5px] border border-branco/10 bg-[#222] px-5 py-8 font-barlow text-branco/80">
              Carregando cardápio...
            </div>
          ) : (
            <>
              <div>
                {secoes.map((secao) => (
                  <SecaoProdutosAdm
                    key={secao.id}
                    secao={secao}
                    onViewProduto={setProdutoSelecionado}
                    onEditProduto={setProdutoEditando}
                    onDeleteProduto={setProdutoExcluindo}
                    ativa={secao.id === secaoAtivaExibida}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {mostrarCriacao && (
        <ProdutoFormModal
          categorias={categorias}
          subcategorias={subcategorias}
          unidades={unidades}
          produto={null}
          onClose={() => setMostrarCriacao(false)}
          onSave={(form) =>
            salvarProduto({
              ...form,
              subcategoriaId: form.subcategoriaId || primeiraSubcategoria,
            })
          }
        />
      )}

      {produtoEditando && (
        <ProdutoFormModal
          categorias={categorias}
          subcategorias={subcategorias}
          unidades={unidades}
          produto={produtoEditando}
          onClose={() => setProdutoEditando(null)}
          onSave={(form) => salvarProduto(form, produtoEditando)}
        />
      )}

      {mostrarCategoriaCriacao && (
        <CategoriaFormModal
          categoria={null}
          onClose={() => setMostrarCategoriaCriacao(false)}
          onSave={(form) => salvarCategoria(form)}
        />
      )}

      {categoriaEditando && (
        <CategoriaFormModal
          categoria={categoriaEditando}
          onClose={() => setCategoriaEditando(null)}
          onSave={(form) => salvarCategoria(form, categoriaEditando)}
        />
      )}

      {mostrarSubcategoriaCriacao && (
        <SubcategoriaFormModal
          categorias={categorias}
          subcategoria={null}
          onClose={() => setMostrarSubcategoriaCriacao(false)}
          onSave={(form) => salvarSubcategoria(form)}
        />
      )}

      {subcategoriaEditando && (
        <SubcategoriaFormModal
          categorias={categorias}
          subcategoria={subcategoriaEditando}
          onClose={() => setSubcategoriaEditando(null)}
          onSave={(form) => salvarSubcategoria(form, subcategoriaEditando)}
        />
      )}

      {produtoExcluindo && (
        <ConfirmarExclusao
          produto={produtoExcluindo}
          onCancel={() => setProdutoExcluindo(null)}
          onConfirm={confirmarExclusao}
        />
      )}

      {categoriaExcluindo && (
        <ConfirmarExclusaoTaxonomia
          titulo="Excluir categoria"
          nome={categoriaExcluindo.nome}
          onCancel={() => setCategoriaExcluindo(null)}
          onConfirm={excluirCategoria}
        />
      )}

      {subcategoriaExcluindo && (
        <ConfirmarExclusaoTaxonomia
          titulo="Excluir subcategoria"
          nome={subcategoriaExcluindo.nome}
          onCancel={() => setSubcategoriaExcluindo(null)}
          onConfirm={excluirSubcategoria}
        />
      )}

      {produtoSelecionado && (
        <DetalheProdutoAdm
          produto={produtoSelecionado}
          onClose={() => setProdutoSelecionado(null)}
          onEdit={(produto) => {
            setProdutoSelecionado(null);
            setProdutoEditando(produto);
          }}
          onDelete={(produto) => {
            setProdutoSelecionado(null);
            setProdutoExcluindo(produto);
          }}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <Rodape />
    </>
  );
}
