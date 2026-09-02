import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import BarraDeNavegacao from "../../componentes/usuario/BarraDeNavegacaoUsuario";
import Rodape from "../../componentes/usuario/Rodape";
import type { ProdutoCardapio, SecaoCardapio } from "../../model/cardapio";
import { listarSecoesCardapio } from "../../repository/cardapioRepository";
import { listarUnidades, type Unidade } from "../../servicos/api";

const formatadorPreco = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatarPreco(preco: string | number) {
  return formatadorPreco.format(Number(preco));
}

function CardProduto({
  produto,
  onSelect,
}: {
  produto: ProdutoCardapio;
  onSelect: (produto: ProdutoCardapio) => void;
}) {
  const precoNormal = produto.variacoes.find(
    (variacao) => variacao.tipo === "normal",
  );
  const precoCombo = produto.variacoes.find(
    (variacao) => variacao.tipo === "combo",
  );
  const imagem = produto.imagemLocal ?? produto.imagem_url ?? "";

  return (
    <button
      type="button"
      onClick={() => onSelect(produto)}
      className="group flex w-full flex-col overflow-hidden rounded-[12px] bg-zinc-700 text-left shadow-[0_12px_24px_rgba(0,0,0,0.28)] outline-none transition-transform duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-amarelo min-[640px]:h-44 min-[640px]:flex-row"
      aria-label={`Ver detalhes de ${produto.nome}`}
    >
      <div className="order-2 grid min-h-[12rem] flex-1 grid-rows-[minmax(0,1fr)_3.25rem] gap-2 px-3 py-3 text-branco min-[640px]:order-1 min-[640px]:min-h-0 min-[640px]:py-4">
        <div className="min-h-0 overflow-hidden">
          <h3 className="line-clamp-2 font-barlow text-lg font-black leading-tight drop-shadow-[0_3px_3px_rgba(0,0,0,0.2)]">
            {produto.nome}
          </h3>

          <p className="mt-1 line-clamp-4 font-barlow text-sm leading-[1.2] text-branco/85 drop-shadow-[0_3px_3px_rgba(0,0,0,0.15)] min-[640px]:line-clamp-2">
            {produto.descricao}
          </p>
        </div>

        <div className="flex h-[3.25rem] items-end justify-between gap-4 border-t border-branco/5 pt-2">
          <div className="min-h-[2.75rem] text-left font-barlow-condensed font-black text-branco min-[640px]:ml-auto min-[640px]:text-right">
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
      </div>

      <div className="order-1 h-44 w-full overflow-hidden border-b border-zinc-800 bg-zinc-600 min-[640px]:order-3 min-[640px]:h-full min-[640px]:w-48 min-[640px]:border-b-0 min-[640px]:border-l">
        {imagem ? (
          <img
            src={imagem}
            alt={produto.nome}
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105 group-hover:brightness-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-600 font-barlow-condensed text-2xl font-black uppercase text-amarelo">
            Paraíba
          </div>
        )}
      </div>
    </button>
  );
}

function DetalheProduto({
  produto,
  onClose,
}: {
  produto: ProdutoCardapio;
  onClose: () => void;
}) {
  const imagem = produto.imagemLocal ?? produto.imagem_url ?? "";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end bg-preto-v1/80 px-4 py-4 backdrop-blur-sm min-[640px]:items-center min-[640px]:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="produto-detalhe-titulo"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[5px] bg-zinc-800 text-branco shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid min-[768px]:grid-cols-[minmax(0,0.95fr)_minmax(20rem,1fr)]">
          <div className="aspect-square overflow-hidden bg-zinc-600 min-[768px]:aspect-auto min-[768px]:h-[28rem]">
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
                  Cardápio
                </p>
                <h3
                  id="produto-detalhe-titulo"
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
          </div>
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
          className="absolute top-full z-30 mt-1 max-h-60 w-full overflow-hidden overflow-y-auto rounded-2xl border border-branco/10 bg-zinc-800 py-1 shadow-[0_10px_24px_rgba(0,0,0,0.22)]"
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

function NavegacaoCategorias({
  secoes,
  secaoAtivaId,
  unidadeSelecionadaId,
  unidades,
  carregandoUnidades,
  erroUnidades,
  onUnidadeChange,
}: {
  secoes: SecaoCardapio[];
  secaoAtivaId: string;
  unidadeSelecionadaId: number | "";
  unidades: Unidade[];
  carregandoUnidades: boolean;
  erroUnidades: boolean;
  onUnidadeChange: (id: number | "") => void;
}) {
  const barraControle =
    "h-12 rounded-2xl border border-branco/10 bg-zinc-800 shadow-[0_10px_24px_rgba(0,0,0,0.22)]";
  const opcaoCategoria =
    "flex h-9 items-center justify-center whitespace-nowrap rounded-xl px-3 font-barlow-condensed text-sm font-black uppercase leading-none transition-colors duration-200 min-[640px]:px-5 min-[640px]:text-base";
  const opcoesUnidade = [
    {
      id: "" as const,
      label: carregandoUnidades ? "Carregando unidades..." : "Todas as unidades",
    },
    ...unidades.map((unidade) => ({ id: unidade.id, label: unidade.nome })),
  ];

  return (
    <nav
      aria-label="Categorias do cardápio"
      className="sticky top-16 z-[40] mt-8 bg-zinc-950 py-4"
    >
      <div className="flex flex-col gap-3 min-[640px]:flex-row min-[640px]:items-stretch min-[640px]:justify-start min-[640px]:gap-3">
        <ul
          className={`order-2 flex w-full items-center gap-1 px-1.5 ${barraControle} min-[640px]:order-1 min-[640px]:w-max min-[640px]:shrink-0`}
        >
          {secoes.map((secao) => (
            <li key={secao.id} className="min-w-0 flex-1 min-[640px]:flex-none">
              <a
                href={`#${secao.id}`}
                className={`${opcaoCategoria} w-full min-[640px]:w-auto ${
                  secaoAtivaId === secao.id
                    ? "bg-amarelo text-preto-v1"
                    : "bg-transparent text-branco/75 hover:bg-branco/10 hover:text-branco"
                }`}
              >
                {secao.titulo}
              </a>
            </li>
          ))}
        </ul>

        <div className="order-1 w-full shrink-0 font-barlow min-[640px]:order-2 min-[640px]:w-52">
          <SeletorUnidadeCardapio
            valor={unidadeSelecionadaId}
            opcoes={opcoesUnidade}
            desabilitado={carregandoUnidades}
            classeBotao={barraControle}
            onChange={onUnidadeChange}
          />
          {erroUnidades && (
            <p className="mt-2 text-xs text-branco/55">
              Não foi possível carregar as unidades. O cardápio completo continua disponível.
            </p>
          )}
        </div>
      </div>
    </nav>
  );
}

function SecaoProdutos({
  secao,
  onSelectProduto,
  ativa,
}: {
  secao: SecaoCardapio;
  onSelectProduto: (produto: ProdutoCardapio) => void;
  ativa: boolean;
}) {
  return (
    <section id={secao.id} className="scroll-mt-44 pt-14 first:pt-12">
      <h2
        className={`font-barlow-condensed text-[clamp(2rem,8vw,3.5rem)] font-black uppercase leading-none transition-colors ${
          ativa ? "text-amarelo" : "text-branco"
        }`}
      >
        {secao.titulo}
      </h2>

      {secao.produtos.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 pb-5 min-[520px]:grid-cols-2 min-[640px]:gap-5 min-[1180px]:grid-cols-3">
          {secao.produtos.map((produto) => (
            <CardProduto
              key={produto.id}
              produto={produto}
              onSelect={onSelectProduto}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[12px] border border-branco/10 bg-zinc-800 px-4 py-5 font-barlow text-sm text-branco/60">
          Categoria cadastrada. Os itens dessa seção ainda não foram
          adicionados.
        </div>
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
    useState<ProdutoCardapio | null>(null);
  const [secaoAtivaId, setSecaoAtivaId] = useState(() =>
    window.location.hash.replace("#", ""),
  );

  useEffect(() => {
    let ativo = true;
    setCarregando(true);

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

  const totalProdutos = useMemo(
    () => secoes.reduce((total, secao) => total + secao.produtos.length, 0),
    [secoes],
  );
  const unidadeSelecionada = useMemo(
    () =>
      unidades.find((unidade) => unidade.id === unidadeSelecionadaId) ?? null,
    [unidadeSelecionadaId, unidades],
  );
  const secaoAtivaExibida = secaoAtivaId || secoes[0]?.id || "";

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

  return (
    <>
      <BarraDeNavegacao />

      <main className="min-h-screen overflow-x-clip bg-zinc-950 pt-[7rem] text-branco">
        <section className="pagina-container pt-6 pb-16 min-[768px]:pt-8">
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

          {!carregando && (
            <NavegacaoCategorias
              secoes={secoes}
              secaoAtivaId={secaoAtivaExibida}
              unidadeSelecionadaId={unidadeSelecionadaId}
              unidades={unidades}
              carregandoUnidades={carregandoUnidades}
              erroUnidades={erroUnidades}
              onUnidadeChange={(id) => {
                setCarregando(true);
                setProdutoSelecionado(null);
                setUnidadeSelecionadaId(id);
              }}
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
              <p className="font-barlow text-sm text-branco/60">
                {totalProdutos} itens disponíveis
                {unidadeSelecionada ? ` em ${unidadeSelecionada.nome}` : ""}.
              </p>

              <div>
                {secoes.map((secao) => (
                  <SecaoProdutos
                    key={secao.id}
                    secao={secao}
                    ativa={secao.id === secaoAtivaExibida}
                    onSelectProduto={setProdutoSelecionado}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {produtoSelecionado && (
        <DetalheProduto
          produto={produtoSelecionado}
          onClose={() => setProdutoSelecionado(null)}
        />
      )}

      <Rodape />
    </>
  );
}
