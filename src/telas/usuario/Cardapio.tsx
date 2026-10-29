import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, Plus, X } from "lucide-react";
import BarraDeNavegacao from "../../componentes/usuario/BarraDeNavegacaoUsuario";
import Rodape from "../../componentes/usuario/Rodape";
import iconeIfood from "../../imagens/social/ifood.svg";
import imagemSmash from "../../imagens/logos/img-smash-home.svg";
import type { ProdutoCardapio, SecaoCardapio } from "../../model/cardapio";
import { listarSecoesCardapio } from "../../repository/cardapioRepository";
import { listarUnidades, type Unidade } from "../../servicos/api";

// Altura do cabeçalho fixo do site (h-16).
const ALTURA_CABECALHO = 64;
// Folga para arredondamentos de pixel ao parar o scroll exatamente no topo da seção.
const TOLERANCIA_SECAO_ATIVA = 8;
const LINK_IFOOD =
  "https://www.ifood.com.br/delivery/brasilia-df/paraiba-hot-dog-sul-aguas-claras/6b414c09-98ff-427f-9c06-1b00ad1438fe";

const TAMANHOS = [
  { sufixo: /\s+duplo$/i, rotulo: "Duplo", ordem: 1 },
  { sufixo: /\s+triplo$/i, rotulo: "Triplo", ordem: 2 },
];

type OpcaoTamanho = {
  rotulo: string;
  ordem: number;
  produto: ProdutoCardapio;
};

type GrupoProduto = {
  id: string;
  nome: string;
  opcoes: OpcaoTamanho[];
};

type SecaoAgrupada = SecaoCardapio & { grupos: GrupoProduto[] };

type ProdutoSelecionado = {
  grupo: GrupoProduto;
  indice: number;
  categoria: string;
};

type BlocoCardapio =
  | { tipo: "cards"; secao: SecaoAgrupada }
  | { tipo: "lista"; secoes: SecaoAgrupada[] };

type ItemVitrine = { grupo: GrupoProduto; categoria: string };

// Posição de cada foto da vitrine: a primeira fica na frente, as outras em leque atrás.
const POSICOES_VITRINE = [
  "left-1/2 top-0 z-20 w-[44%] -translate-x-1/2",
  "left-[4%] top-[14%] z-10 w-[33%] -rotate-[7deg]",
  "right-[4%] top-[10%] z-10 w-[33%] rotate-[6deg]",
];

const formatadorPreco = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatarPreco(preco: string | number) {
  return formatadorPreco.format(Number(preco));
}

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function imagemDoProduto(produto: ProdutoCardapio) {
  return produto.imagemLocal ?? produto.imagem_url ?? "";
}

function precosDoProduto(produto: ProdutoCardapio) {
  return {
    normal: produto.variacoes.find((variacao) => variacao.tipo === "normal"),
    combo: produto.variacoes.find((variacao) => variacao.tipo === "combo"),
  };
}

function contarOpcoes(grupos: GrupoProduto[]) {
  return grupos.reduce((total, grupo) => total + grupo.opcoes.length, 0);
}

function separarTamanho(nome: string) {
  const nomeLimpo = nome.trim();
  const tamanho = TAMANHOS.find(({ sufixo }) => sufixo.test(nomeLimpo));

  if (!tamanho) return { base: nomeLimpo, rotulo: "Simples", ordem: 0 };

  return {
    base: nomeLimpo.replace(tamanho.sufixo, ""),
    rotulo: tamanho.rotulo,
    ordem: tamanho.ordem,
  };
}

// Junta "Tradicional" e "Tradicional Duplo" em um único card com seletor de tamanho.
function agruparPorTamanho(produtos: ProdutoCardapio[]): GrupoProduto[] {
  const grupos: GrupoProduto[] = [];
  const gruposPorNome = new Map<string, GrupoProduto>();

  produtos.forEach((produto) => {
    const { base, rotulo, ordem } = separarTamanho(produto.nome);
    const chave = normalizarTexto(base);
    let grupo = gruposPorNome.get(chave);

    // Dois produtos com o mesmo nome e tamanho continuam em cards separados.
    if (!grupo || grupo.opcoes.some((opcao) => opcao.ordem === ordem)) {
      grupo = { id: `produto-${produto.id}`, nome: base, opcoes: [] };
      grupos.push(grupo);
      if (!gruposPorNome.has(chave)) gruposPorNome.set(chave, grupo);
    }

    grupo.opcoes.push({ rotulo, ordem, produto });
  });

  return grupos.map((grupo) => ({
    ...grupo,
    nome: grupo.opcoes.length === 1 ? grupo.opcoes[0].produto.nome : grupo.nome,
    opcoes: [...grupo.opcoes].sort((a, b) => a.ordem - b.ordem),
  }));
}

// Seções de bebidas e acompanhamentos em sequência ficam lado a lado, em lista.
function montarBlocos(secoes: SecaoAgrupada[]): BlocoCardapio[] {
  const blocos: BlocoCardapio[] = [];

  secoes.forEach((secao) => {
    const ultimo = blocos[blocos.length - 1];

    if (!secao.destaque) {
      blocos.push({ tipo: "cards", secao });
    } else if (ultimo?.tipo === "lista") {
      ultimo.secoes.push(secao);
    } else {
      blocos.push({ tipo: "lista", secoes: [secao] });
    }
  });

  return blocos;
}

// Alterna entre as categorias de lanche para a vitrine não mostrar só um tipo.
function escolherVitrine(secoes: SecaoAgrupada[], limite: number) {
  const filas = secoes
    .filter((secao) => !secao.destaque)
    .map((secao) => ({
      categoria: secao.titulo,
      grupos: secao.grupos.filter((grupo) =>
        imagemDoProduto(grupo.opcoes[0].produto),
      ),
    }));
  const escolhidos: ItemVitrine[] = [];

  for (let posicao = 0; escolhidos.length < limite; posicao++) {
    const daVez = filas.filter((fila) => fila.grupos[posicao]);
    if (!daVez.length) break;

    daVez.forEach((fila) => {
      if (escolhidos.length < limite) {
        escolhidos.push({ grupo: fila.grupos[posicao], categoria: fila.categoria });
      }
    });
  }

  return escolhidos;
}

function ImagemProduto({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [falhou, setFalhou] = useState(false);

  if (!src || falhou) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-800 font-barlow-condensed text-2xl font-black uppercase text-amarelo ${className}`}
      >
        Paraíba
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFalhou(true)}
      // As fotos são verticais e o lanche fica abaixo do centro.
      className={`object-cover object-[50%_62%] ${className}`}
    />
  );
}

function SeletorTamanho({
  opcoes,
  indice,
  onChange,
  className = "",
}: {
  opcoes: OpcaoTamanho[];
  indice: number;
  onChange: (indice: number) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Tamanho"
      className={`gap-1 rounded-xl bg-zinc-950 p-1 ${className}`}
    >
      {opcoes.map((opcao, posicao) => {
        const ativo = posicao === indice;

        return (
          <button
            key={opcao.produto.id}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(posicao)}
            className={`h-10 flex-1 rounded-[9px] font-barlow-condensed text-base font-extrabold uppercase tracking-wide transition-colors duration-200 ${
              ativo
                ? "bg-amarelo text-preto-v1"
                : "text-branco/75 hover:bg-branco/10 hover:text-branco"
            }`}
          >
            {opcao.rotulo}
          </button>
        );
      })}
    </div>
  );
}

function CardProduto({
  grupo,
  onSelect,
}: {
  grupo: GrupoProduto;
  onSelect: (grupo: GrupoProduto, indice: number) => void;
}) {
  const [indiceEscolhido, setIndiceEscolhido] = useState(0);
  const indice = Math.min(indiceEscolhido, grupo.opcoes.length - 1);
  const { produto } = grupo.opcoes[indice];
  const { normal, combo } = precosDoProduto(produto);
  const imagem = imagemDoProduto(produto);
  const temTamanhos = grupo.opcoes.length > 1;

  return (
    <article className="group relative flex gap-3.5 overflow-hidden rounded-[18px] border border-branco/[0.07] bg-preto-v3 p-3 shadow-[0_12px_24px_rgba(0,0,0,0.28)] transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-amarelo/45 min-[520px]:flex-col min-[520px]:gap-0 min-[520px]:p-0">
      <button
        type="button"
        onClick={() => onSelect(grupo, indice)}
        aria-label={`Ver detalhes de ${grupo.nome}`}
        className="absolute inset-0 z-10 rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amarelo min-[520px]:hidden"
      />

      <div className="h-26 w-26 shrink-0 overflow-hidden rounded-xl bg-zinc-800 min-[520px]:aspect-[4/3] min-[520px]:h-auto min-[520px]:w-full min-[520px]:rounded-none">
        <ImagemProduto
          key={imagem}
          src={imagem}
          alt={grupo.nome}
          className="h-full w-full transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 min-[520px]:gap-3.5 min-[520px]:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-barlow-condensed text-[1.375rem] font-black uppercase leading-none min-[520px]:text-3xl">
            {grupo.nome}
          </h3>
          {temTamanhos && (
            <span className="shrink-0 font-barlow text-[11px] font-bold uppercase tracking-wider text-branco/60 min-[520px]:hidden">
              {grupo.opcoes.map((opcao) => opcao.rotulo).join(" · ")}
            </span>
          )}
        </div>

        <p className="line-clamp-2 font-barlow text-[13px] leading-snug text-branco/70 min-[520px]:line-clamp-3 min-[520px]:min-h-[3.8rem] min-[520px]:text-sm min-[520px]:leading-[1.45]">
          {produto.descricao}
        </p>

        {temTamanhos ? (
          <SeletorTamanho
            opcoes={grupo.opcoes}
            indice={indice}
            onChange={setIndiceEscolhido}
            className="hidden min-[520px]:flex"
          />
        ) : (
          <p className="hidden h-12 items-center font-barlow text-[13px] font-semibold text-branco/55 min-[520px]:flex">
            Tamanho único
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 min-[520px]:border-t min-[520px]:border-branco/[0.07] min-[520px]:pt-3.5">
          <div className="flex flex-wrap items-baseline gap-x-2 min-[520px]:block">
            {normal && (
              <p className="font-barlow-condensed text-[1.375rem] font-extrabold leading-none min-[520px]:text-[2.125rem]">
                {formatarPreco(normal.preco)}
              </p>
            )}
            {combo && (
              <p className="font-barlow text-xs font-semibold text-amarelo min-[520px]:mt-1.5 min-[520px]:text-[13px]">
                Combo {formatarPreco(combo.preco)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelect(grupo, indice)}
            aria-label={`Ver detalhes de ${grupo.nome}`}
            className="hidden h-11 shrink-0 items-center gap-2 rounded-xl border border-branco/20 px-4 font-barlow text-sm font-semibold text-branco transition-colors hover:border-amarelo hover:text-amarelo min-[520px]:flex"
          >
            Detalhes
            <Plus aria-hidden className="h-4 w-4" strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </article>
  );
}

function VitrineHero({
  itens,
  carregando,
  onSelect,
}: {
  itens: ItemVitrine[];
  carregando: boolean;
  onSelect: (item: ItemVitrine) => void;
}) {
  if (carregando) {
    return (
      <div aria-hidden className="relative aspect-[16/10] w-full">
        {POSICOES_VITRINE.map((posicao) => (
          <div
            key={posicao}
            className={`absolute aspect-[3/4] animate-pulse rounded-[22px] bg-zinc-800 ${posicao}`}
          />
        ))}
      </div>
    );
  }

  if (!itens.length) {
    return (
      <img
        src={imagemSmash}
        alt=""
        aria-hidden
        className="mx-auto h-auto w-full max-w-md object-contain"
      />
    );
  }

  return (
    <div className="relative aspect-[16/10] w-full">
      <div
        aria-hidden
        className="absolute inset-[12%] rounded-full bg-amarelo/15 blur-3xl"
      />

      {itens.map((item, ordem) => {
        const imagem = imagemDoProduto(item.grupo.opcoes[0].produto);
        const frente = ordem === 0;

        return (
          <button
            key={item.grupo.id}
            type="button"
            onClick={() => onSelect(item)}
            aria-label={`Ver detalhes de ${item.grupo.nome}`}
            className={`group absolute overflow-hidden rounded-[22px] border border-branco/10 bg-preto-v3 shadow-[0_24px_48px_rgba(0,0,0,0.55)] outline-none transition-[scale,border-color] duration-300 hover:scale-[1.03] hover:border-amarelo/50 focus-visible:ring-2 focus-visible:ring-amarelo ${POSICOES_VITRINE[ordem]}`}
          >
            <ImagemProduto
              key={imagem}
              src={imagem}
              alt=""
              className="aspect-[3/4] w-full transition-transform duration-700 group-hover:scale-105"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0)_45%,rgba(10,10,10,0.92)_100%)]"
            />
            <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-left">
              <span className="font-barlow text-[11px] font-extrabold uppercase tracking-[0.12em] text-amarelo">
                {item.categoria}
              </span>
              <span
                className={`font-barlow-condensed font-black uppercase leading-[0.95] text-branco ${
                  frente ? "text-3xl" : "text-xl"
                }`}
              >
                {item.grupo.nome}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DetalheProduto({
  selecionado,
  onClose,
}: {
  selecionado: ProdutoSelecionado;
  onClose: () => void;
}) {
  const { grupo, categoria } = selecionado;
  const [indice, setIndice] = useState(selecionado.indice);
  const { produto } = grupo.opcoes[indice];
  const imagem = imagemDoProduto(produto);

  useEffect(() => {
    function fecharComEsc(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", fecharComEsc);
    return () => document.removeEventListener("keydown", fecharComEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end bg-preto-v1/80 backdrop-blur-sm min-[640px]:items-center min-[640px]:justify-center min-[640px]:px-4 min-[640px]:py-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="produto-detalhe-titulo"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[24px] bg-preto-v3 text-branco shadow-[0_24px_80px_rgba(0,0,0,0.55)] min-[640px]:rounded-[22px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid min-h-0 flex-1 overflow-y-auto min-[768px]:grid-cols-[minmax(0,0.95fr)_minmax(20rem,1fr)]">
          <div className="h-56 overflow-hidden bg-zinc-800 min-[640px]:h-72 min-[768px]:h-full min-[768px]:min-h-[30rem]">
            <ImagemProduto
              key={imagem}
              src={imagem}
              alt={produto.nome}
              className="h-full w-full"
            />
          </div>

          <div className="flex flex-col gap-4 p-5 min-[640px]:p-7">
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-barlow text-xs font-extrabold uppercase tracking-[0.12em] text-amarelo">
                  {categoria}
                </p>
                <h3
                  id="produto-detalhe-titulo"
                  className="mt-1 font-barlow-condensed text-[2.75rem] font-black uppercase leading-[0.9] text-branco"
                >
                  {grupo.nome}
                </h3>
              </div>

              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-branco/15 text-branco transition-colors hover:border-amarelo hover:text-amarelo"
                onClick={onClose}
                aria-label="Fechar detalhes"
              >
                <X aria-hidden className="h-5 w-5" strokeWidth={3} />
              </button>
            </div>

            <p className="font-barlow text-[15px] leading-normal text-branco/80">
              {produto.descricao}
            </p>

            {grupo.opcoes.length > 1 && (
              <SeletorTamanho
                opcoes={grupo.opcoes}
                indice={indice}
                onChange={setIndice}
                className="flex"
              />
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {produto.variacoes.map((variacao) => {
                const combo = variacao.tipo === "combo";

                return (
                  <div
                    key={variacao.id}
                    className={`rounded-xl border px-4 py-3 ${
                      combo ? "border-amarelo" : "border-branco/15"
                    }`}
                  >
                    <p
                      className={`font-barlow text-xs font-bold uppercase tracking-wider ${
                        combo ? "text-amarelo" : "text-branco/60"
                      }`}
                    >
                      {variacao.nome}
                    </p>
                    <p className="mt-1 font-barlow-condensed text-3xl font-extrabold leading-none text-branco">
                      {formatarPreco(variacao.preco)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div>
              <h4 className="font-barlow-condensed text-2xl font-extrabold uppercase text-amarelo">
                Adicionais
              </h4>

              {produto.adicionais.length > 0 ? (
                <ul className="mt-2.5 grid gap-1.5">
                  {produto.adicionais.map((adicional) => (
                    <li
                      key={adicional.id}
                      className="flex items-center justify-between gap-4 rounded-[10px] bg-zinc-950 px-3.5 py-2.5 font-barlow text-sm"
                    >
                      <span className="min-w-0 text-branco/90">
                        {adicional.nome}
                      </span>
                      <span className="shrink-0 font-barlow-condensed text-xl font-extrabold text-branco">
                        + {formatarPreco(adicional.preco)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2.5 font-barlow text-sm text-branco/65">
                  Nenhum adicional cadastrado para este item.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-branco/[0.08] px-5 py-3.5 min-[640px]:px-7">
          <a
            href={LINK_IFOOD}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-amarelo font-barlow-condensed text-xl font-extrabold uppercase tracking-wide text-preto-v1 transition-opacity hover:opacity-90"
          >
            Pedir no iFood
            <ArrowUpRight aria-hidden className="h-5 w-5" strokeWidth={2.6} />
          </a>
        </div>
      </div>
    </div>
  );
}

function SeletorUnidadeCardapio({
  valor,
  opcoes,
  desabilitado = false,
  classeBotao,
  onChange,
}: {
  valor: number | "";
  opcoes: Array<{ id: number | ""; label: string }>;
  desabilitado?: boolean;
  classeBotao: string;
  onChange: (id: number | "") => void;
}) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listaId = useId();
  const labelAtual =
    opcoes.find((opcao) => opcao.id === valor)?.label ?? "Todas as unidades";

  useEffect(() => {
    if (!aberto) return;

    function fecharAoClicarFora(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    return () => document.removeEventListener("mousedown", fecharAoClicarFora);
  }, [aberto]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        id="unidade-cardapio"
        disabled={desabilitado}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={listaId}
        onClick={() => !desabilitado && setAberto((atual) => !atual)}
        className={`flex w-full items-center justify-between gap-3 px-4 font-barlow text-sm font-semibold text-branco transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${classeBotao} ${
          aberto
            ? "border-amarelo ring-2 ring-amarelo/30"
            : "hover:border-branco/20"
        }`}
      >
        <span className="truncate text-left">{labelAtual}</span>
        <ChevronDown
          size={20}
          className={`shrink-0 text-branco/65 transition-transform duration-200 ${
            aberto ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {aberto && (
        <ul
          id={listaId}
          role="listbox"
          aria-labelledby="unidade-cardapio"
          className="absolute top-full z-[45] mt-1 max-h-60 w-full overflow-hidden overflow-y-auto rounded-2xl border border-branco/10 bg-zinc-800 py-1 shadow-[0_10px_24px_rgba(0,0,0,0.22)]"
        >
          {opcoes.map((opcao) => {
            const selecionada = opcao.id === valor;

            return (
              <li key={String(opcao.id)} role="option" aria-selected={selecionada}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opcao.id);
                    setAberto(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left font-barlow text-sm font-semibold transition-colors ${
                    selecionada
                      ? "bg-amarelo text-preto-v1"
                      : "text-branco hover:bg-zinc-700"
                  }`}
                >
                  {opcao.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function BarraCategorias({
  secoes,
  secaoAtivaId,
  classeBarra,
  onSelecionar,
}: {
  secoes: SecaoAgrupada[];
  secaoAtivaId: string;
  classeBarra: string;
  onSelecionar: (secaoId: string) => void;
}) {
  const listaRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const lista = listaRef.current;
    if (!lista) return;

    const item = lista.querySelector<HTMLElement>(
      `[data-secao="${secaoAtivaId}"]`,
    );
    if (!item) return;

    const inicioItem = item.offsetLeft;
    const fimItem = inicioItem + item.offsetWidth;
    const inicioVisivel = lista.scrollLeft;
    const fimVisivel = inicioVisivel + lista.clientWidth;

    if (inicioItem < inicioVisivel || fimItem > fimVisivel) {
      lista.scrollTo({
        left: inicioItem - (lista.clientWidth - item.offsetWidth) / 2,
        behavior: "smooth",
      });
    }
  }, [secaoAtivaId]);

  return (
    <ul
      ref={listaRef}
      aria-label="Categorias do cardápio"
      className={`flex w-fit max-w-full min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain px-1.5 sem-barra-rolagem ${classeBarra}`}
    >
      {secoes.map((secao) => {
        const ativa = secao.id === secaoAtivaId;

        return (
          <li key={secao.id} className="shrink-0">
            <a
              href={`#${secao.id}`}
              data-secao={secao.id}
              onClick={() => onSelecionar(secao.id)}
              aria-label={`Ir para ${secao.titulo}`}
              aria-current={ativa ? "location" : undefined}
              className={`flex h-9 items-center justify-center whitespace-nowrap rounded-xl px-4 font-barlow-condensed text-sm font-black uppercase leading-none transition-colors duration-200 min-[640px]:px-5 min-[640px]:text-base ${
                ativa
                  ? "bg-amarelo text-preto-v1"
                  : "bg-transparent text-branco/75 hover:bg-branco/10 hover:text-branco"
              }`}
            >
              {secao.titulo}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function NavegacaoCategorias({
  secoes,
  secaoAtivaId,
  onSelecionarSecao,
  navRef,
}: {
  secoes: SecaoAgrupada[];
  secaoAtivaId: string;
  onSelecionarSecao: (secaoId: string) => void;
  navRef: React.RefObject<HTMLElement | null>;
}) {
  const barraControle =
    "h-12 rounded-2xl border border-branco/10 bg-zinc-800 shadow-[0_10px_24px_rgba(0,0,0,0.22)]";

  return (
    <nav
      ref={navRef}
      aria-label="Categorias do cardápio"
      className="sticky top-16 z-[40] mt-6 bg-zinc-950 py-4 min-[960px]:mt-8"
    >
      <div className="flex flex-col gap-3 min-[900px]:flex-row min-[900px]:items-stretch">
        <div className="min-w-0 min-[900px]:flex-1">
          <BarraCategorias
            secoes={secoes}
            secaoAtivaId={secaoAtivaId}
            classeBarra={barraControle}
            onSelecionar={onSelecionarSecao}
          />
        </div>
      </div>
    </nav>
  );
}

function SecaoCards({
  secao,
  ativa,
  margemAncora,
  onSelect,
}: {
  secao: SecaoAgrupada;
  ativa: boolean;
  margemAncora: number;
  onSelect: (grupo: GrupoProduto, indice: number) => void;
}) {
  return (
    <section
      id={secao.id}
      style={{ scrollMarginTop: `${margemAncora}px` }}
      className="pt-14 first:pt-12"
    >
      <div className="mb-6">
        <div>
          <h2
            className={`font-barlow-condensed text-[clamp(2.75rem,8vw,4rem)] font-black uppercase leading-[0.9] transition-colors ${
              ativa ? "text-amarelo" : "text-branco"
            }`}
          >
            {secao.titulo}
          </h2>
          <p className="mt-2 font-barlow text-sm text-branco/60">
            {contarOpcoes(secao.grupos)} opções
          </p>
        </div>
      </div>

      {secao.grupos.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 pb-5 min-[520px]:grid-cols-2 min-[640px]:gap-6 min-[1180px]:grid-cols-3">
          {secao.grupos.map((grupo) => (
            <CardProduto key={grupo.id} grupo={grupo} onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <div className="rounded-[12px] border border-branco/10 bg-zinc-800 px-4 py-5 font-barlow text-sm text-branco/60">
          Categoria cadastrada. Os itens dessa seção ainda não foram
          adicionados.
        </div>
      )}
    </section>
  );
}

function SecaoLista({
  secao,
  ativa,
  margemAncora,
  onSelect,
}: {
  secao: SecaoAgrupada;
  ativa: boolean;
  margemAncora: number;
  onSelect: (grupo: GrupoProduto, indice: number) => void;
}) {
  return (
    <section
      id={secao.id}
      style={{ scrollMarginTop: `${margemAncora}px` }}
      className="rounded-[18px] border border-branco/[0.07] bg-preto-v3 p-5 min-[640px]:p-7"
    >
      <h2
        className={`break-words font-barlow-condensed text-[clamp(1.75rem,9vw,2.5rem)] font-black uppercase leading-[0.9] transition-colors min-[640px]:text-5xl ${
          ativa ? "text-amarelo" : "text-branco"
        }`}
      >
        {secao.titulo}
      </h2>
      <p className="mb-3 mt-2 font-barlow text-sm text-branco/60">
        {contarOpcoes(secao.grupos)} opções
      </p>

      {secao.grupos.length > 0 ? (
        <ul>
          {secao.grupos.map((grupo) => {
            const { produto } = grupo.opcoes[0];
            const { normal } = precosDoProduto(produto);

            return (
              <li key={grupo.id} className="border-t border-branco/[0.08]">
                <button
                  type="button"
                  onClick={() => onSelect(grupo, 0)}
                  className="group w-full rounded-sm py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-amarelo"
                >
                  <span className="flex items-baseline gap-3">
                    <span className="min-w-0 break-words font-barlow-condensed text-[1.375rem] font-extrabold uppercase leading-tight text-branco transition-colors group-hover:text-amarelo">
                      {grupo.nome}
                    </span>
                    <span
                      aria-hidden
                      className="min-w-4 flex-1 -translate-y-1 border-b-2 border-dotted border-branco/20"
                    />
                    {normal && (
                      <span className="shrink-0 font-barlow-condensed text-2xl font-extrabold text-amarelo">
                        {formatarPreco(normal.preco)}
                      </span>
                    )}
                  </span>
                  {produto.descricao && (
                    <span className="mt-1 block font-barlow text-sm leading-snug text-branco/70">
                      {produto.descricao}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border-t border-branco/[0.08] pt-4 font-barlow text-sm text-branco/60">
          Categoria cadastrada. Os itens dessa seção ainda não foram
          adicionados.
        </p>
      )}
    </section>
  );
}

export default function Cardapio() {
  const [secoes, setSecoes] = useState<SecaoCardapio[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [unidadeSelecionadaId, setUnidadeSelecionadaId] = useState<number | "">(
    "",
  );
  const [carregando, setCarregando] = useState(true);
  const [carregandoUnidades, setCarregandoUnidades] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [erroUnidades, setErroUnidades] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] =
    useState<ProdutoSelecionado | null>(null);
  const [secaoAtivaId, setSecaoAtivaId] = useState(() =>
    window.location.hash.replace("#", ""),
  );

  useEffect(() => {
    let ativo = true;

    listarSecoesCardapio(unidadeSelecionadaId || null, false, true)
      .then((resultado) => {
        if (!ativo) return;
        setSecoes(resultado);
        setErroCarregamento(false);
      })
      .catch(() => {
        if (ativo) {
          setSecoes([]);
          setErroCarregamento(true);
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
    let ativo = true;

    listarUnidades()
      .then((resultado) => {
        if (!ativo) return;
        setUnidades(resultado);
        setErroUnidades(false);
      })
      .catch(() => {
        if (ativo) {
          setUnidades([]);
          setErroUnidades(true);
        }
      })
      .finally(() => {
        if (ativo) setCarregandoUnidades(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const secoesAgrupadas = useMemo<SecaoAgrupada[]>(
    () =>
      // Categorias de lanche vêm antes das listas de bebidas e acompanhamentos.
      [...secoes]
        .sort((a, b) => Number(Boolean(a.destaque)) - Number(Boolean(b.destaque)))
        .map((secao) => ({
          ...secao,
          grupos: agruparPorTamanho(secao.produtos),
        })),
    [secoes],
  );

  const blocos = useMemo(() => montarBlocos(secoesAgrupadas), [secoesAgrupadas]);
  const vitrine = useMemo(
    () => escolherVitrine(secoesAgrupadas, POSICOES_VITRINE.length),
    [secoesAgrupadas],
  );

  const unidadeSelecionada = useMemo(
    () =>
      unidades.find((unidade) => unidade.id === unidadeSelecionadaId) ?? null,
    [unidadeSelecionadaId, unidades],
  );
  const opcoesUnidade = [
    {
      id: "" as const,
      label: carregandoUnidades ? "Carregando unidades..." : "Todas as unidades",
    },
    ...unidades.map((unidade) => ({ id: unidade.id, label: unidade.nome })),
  ];
  const secaoAtivaExibida = secaoAtivaId || secoesAgrupadas[0]?.id || "";
  const navRef = useRef<HTMLElement>(null);
  const secaoClicadaRef = useRef("");
  const [alturaNav, setAlturaNav] = useState(0);
  const margemAncora = ALTURA_CABECALHO + alturaNav;
  const selecionarSecao = (secaoId: string) => {
    secaoClicadaRef.current = secaoId;
    setSecaoAtivaId(secaoId);
  };

  const abrirProduto = (categoria: string) => (grupo: GrupoProduto, indice: number) =>
    setProdutoSelecionado({ grupo, indice, categoria });

  useEffect(() => {
    const elemento = navRef.current;
    if (!elemento) return;

    const medir = () => setAlturaNav(elemento.offsetHeight);
    medir();

    const observador = new ResizeObserver(medir);
    observador.observe(elemento);

    return () => observador.disconnect();
  }, [secoes, carregando]);

  useEffect(() => {
    if (!secoesAgrupadas.length) return;

    const atualizarSecaoAtiva = () => {
      const fimDaPagina =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;

      // No fim da página as últimas seções não conseguem subir até a barra:
      // vale a seção clicada se estiver visível, senão a última que aparece na tela.
      if (fimDaPagina) {
        const clicada = document.getElementById(secaoClicadaRef.current);
        if (clicada && clicada.getBoundingClientRect().top < window.innerHeight) {
          setSecaoAtivaId(secaoClicadaRef.current);
          return;
        }
      }

      const pontoAtivo = fimDaPagina
        ? window.scrollY + window.innerHeight - 1
        : window.scrollY + ALTURA_CABECALHO + alturaNav + TOLERANCIA_SECAO_ATIVA;
      let secaoAtual = secoesAgrupadas[0]?.id ?? "";
      let topoAtual = -Infinity;

      secoesAgrupadas.forEach((secao) => {
        const elemento = document.getElementById(secao.id);
        if (!elemento) return;

        // Seções lado a lado têm o mesmo topo: vale a clicada, senão a primeira delas.
        const topo = elemento.getBoundingClientRect().top + window.scrollY;
        const empate =
          Math.abs(topo - topoAtual) < 1 && secao.id === secaoClicadaRef.current;
        if (topo <= pontoAtivo && (topo > topoAtual || empate)) {
          secaoAtual = secao.id;
          topoAtual = topo;
        }
      });

      setSecaoAtivaId(secaoAtual);
    };

    let frameId = 0;
    const reagirAoScroll = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(atualizarSecaoAtiva);
    };

    // Rolagem feita pelo usuário deixa de dar prioridade à aba clicada.
    const esquecerClique = () => {
      secaoClicadaRef.current = "";
    };

    atualizarSecaoAtiva();
    window.addEventListener("scroll", reagirAoScroll, { passive: true });
    window.addEventListener("resize", reagirAoScroll);
    window.addEventListener("wheel", esquecerClique, { passive: true });
    window.addEventListener("touchstart", esquecerClique, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", reagirAoScroll);
      window.removeEventListener("resize", reagirAoScroll);
      window.removeEventListener("wheel", esquecerClique);
      window.removeEventListener("touchstart", esquecerClique);
    };
  }, [secoesAgrupadas, alturaNav]);

  return (
    <>
      <BarraDeNavegacao />

      <main className="min-h-screen overflow-x-clip bg-zinc-950 pt-[7rem] text-branco">
        <section className="pagina-container pt-6 pb-16 min-[768px]:pt-8">
          <div className="grid items-center gap-8 min-[960px]:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] min-[960px]:gap-12">
            <div className="flex flex-col justify-center gap-5">
              <p className="flex items-center gap-3 font-barlow text-sm font-bold uppercase tracking-[0.14em] text-amarelo">
                <span aria-hidden className="h-0.5 w-8 rounded-full bg-amarelo" />
                Paraíba Hot Dog
              </p>
              <h1 className="font-barlow-condensed text-[clamp(4.5rem,15vw,9.5rem)] font-black uppercase leading-[0.85] text-branco">
                Cardápio
              </h1>
              <p className="max-w-xl font-barlow text-lg leading-snug text-branco/80 min-[640px]:text-xl">
                Smashdogs, hotdogs, bebidas e acompanhamentos com o tempero mais
                arretado de Brasília.
              </p>

              <div className="flex flex-col gap-3 min-[480px]:flex-row">
                <div className="font-barlow min-[480px]:w-60">
                  <SeletorUnidadeCardapio
                    valor={unidadeSelecionadaId}
                    opcoes={opcoesUnidade}
                    desabilitado={carregandoUnidades}
                    classeBotao="h-12 rounded-2xl border border-branco/10 bg-zinc-800"
                    onChange={(id) => {
                      setCarregando(true);
                      setProdutoSelecionado(null);
                      setUnidadeSelecionadaId(id);
                    }}
                  />
                </div>
                <a
                  href={LINK_IFOOD}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Pedir no iFood"
                  className="flex h-12 items-center justify-center gap-2.5 rounded-2xl bg-[#EA1D2C] px-6 font-barlow-condensed text-xl font-extrabold uppercase tracking-wide text-branco shadow-[0_8px_24px_rgba(234,29,44,0.35)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(234,29,44,0.5)]"
                >
                  Pedir no
                  <img src={iconeIfood} alt="" aria-hidden className="h-6 w-auto brightness-0 invert" />
                  <ArrowUpRight aria-hidden className="h-5 w-5" strokeWidth={2.6} />
                </a>
              </div>
              {erroUnidades && (
                <p className="text-xs text-branco/55">
                  Não foi possível carregar as unidades. O cardápio completo continua disponível.
                </p>
              )}

              {!carregando && !erroCarregamento && unidadeSelecionada && (
                <p className="font-barlow text-sm text-branco/60">
                  Mostrando os itens disponíveis em {unidadeSelecionada.nome}.
                </p>
              )}
            </div>

            <div className="hidden min-[960px]:block">
              <VitrineHero
                itens={vitrine}
                carregando={carregando}
                onSelect={({ grupo, categoria }) =>
                  setProdutoSelecionado({ grupo, indice: 0, categoria })
                }
              />
            </div>
          </div>

          {!carregando && !erroCarregamento && (
            <NavegacaoCategorias
              secoes={secoesAgrupadas}
              secaoAtivaId={secaoAtivaExibida}
              onSelecionarSecao={selecionarSecao}
              navRef={navRef}
            />
          )}

          {carregando ? (
            <div className="mt-12 rounded-[5px] border border-branco/10 bg-zinc-800 px-5 py-8 font-barlow text-branco/80">
              Carregando cardápio...
            </div>
          ) : erroCarregamento ? (
            <div className="mt-12 rounded-[5px] border border-branco/10 bg-zinc-800 px-5 py-8 font-barlow text-branco/80">
              Não foi possível carregar o cardápio no momento.
            </div>
          ) : (
            <>
              <div>
                {blocos.map((bloco) =>
                  bloco.tipo === "cards" ? (
                    <SecaoCards
                      key={bloco.secao.id}
                      secao={bloco.secao}
                      ativa={bloco.secao.id === secaoAtivaExibida}
                      margemAncora={margemAncora}
                      onSelect={abrirProduto(bloco.secao.titulo)}
                    />
                  ) : (
                    <div
                      key={bloco.secoes.map((secao) => secao.id).join("-")}
                      className="grid grid-cols-1 items-start gap-4 pt-14 min-[900px]:grid-cols-2 min-[900px]:gap-6"
                    >
                      {bloco.secoes.map((secao) => (
                        <SecaoLista
                          key={secao.id}
                          secao={secao}
                          ativa={secao.id === secaoAtivaExibida}
                          margemAncora={margemAncora}
                          onSelect={abrirProduto(secao.titulo)}
                        />
                      ))}
                    </div>
                  ),
                )}
              </div>
            </>
          )}
        </section>
      </main>

      {produtoSelecionado && (
        <DetalheProduto
          selecionado={produtoSelecionado}
          onClose={() => setProdutoSelecionado(null)}
        />
      )}

      <Rodape />
    </>
  );
}
