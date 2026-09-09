import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from "../../componentes/administrador/BarraDeNavegacaoAdmin";
import {
  atualizarAvaliacaoApi,
  criarAvaliacaoApi,
  excluirAvaliacaoApi,
  limitarNota,
  listarTodasAvaliacoesApi,
  notaValida,
  NOTA_MAXIMA,
  NOTA_MINIMA,
  type AvaliacaoApi,
} from "../../servicos/avaliacoesApi";

const MAX_FEEDBACK = 600;
const MAX_NOME = 80;

/** Mantém apenas letras (incluindo acentuadas e "ç") e espaços. */
function sanitizarNome(valor: string) {
  return valor.replace(/[^\p{L}\p{M}\s]/gu, "").slice(0, MAX_NOME);
}

type FormularioAvaliacao = {
  nomeCliente: string;
  descricao: string;
  estrelas: number;
};

const formularioVazio: FormularioAvaliacao = {
  nomeCliente: "",
  descricao: "",
  estrelas: 5,
};

export default function GestaoAvaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoApi[]>([]);
  const [formulario, setFormulario] =
    useState<FormularioAvaliacao>(formularioVazio);
  const [notaDraft, setNotaDraft] = useState(String(formularioVazio.estrelas));
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alterandoId, setAlterandoId] = useState<number | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [avaliacaoParaExcluir, setAvaliacaoParaExcluir] =
    useState<AvaliacaoApi | null>(null);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [avaliacaoEmEdicao, setAvaliacaoEmEdicao] =
    useState<AvaliacaoApi | null>(null);
  const [erro, setErro] = useState("");
  const [notificacao, setNotificacao] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    listarTodasAvaliacoesApi()
      .then((dados) => {
        if (ativo) setAvaliacoes([...dados].sort((a, b) => b.id - a.id));
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const visiveis = useMemo(
    () => avaliacoes.filter((avaliacao) => avaliacao.ativo).length,
    [avaliacoes],
  );

  const editando = avaliacaoEmEdicao !== null;
  const nomePreenchido = formulario.nomeCliente.trim().length > 0;
  const textoPreenchido = formulario.descricao.trim().length > 0;
  const notaOk = notaValida(formulario.estrelas);
  const formularioValido = nomePreenchido && textoPreenchido && notaOk;

  function limparAvisos() {
    setErro("");
  }

  function definirNota(valor: number) {
    limparAvisos();
    const nota = limitarNota(valor);
    setFormulario((atual) => ({ ...atual, estrelas: nota }));
    setNotaDraft(String(nota));
  }

  function digitarNota(texto: string) {
    limparAvisos();
    setNotaDraft(texto);
    const numero = Number(texto);
    if (texto.trim() !== "" && Number.isFinite(numero)) {
      setFormulario((atual) => ({ ...atual, estrelas: limitarNota(numero) }));
    }
  }

  function confirmarNota() {
    const nota = limitarNota(Number(notaDraft));
    setFormulario((atual) => ({ ...atual, estrelas: nota }));
    setNotaDraft(String(nota));
  }

  function abrirModalCadastro() {
    limparAvisos();
    setAvaliacaoEmEdicao(null);
    setFormulario(formularioVazio);
    setNotaDraft(String(formularioVazio.estrelas));
    setModalCadastroAberto(true);
  }

  function abrirModalEdicao(avaliacao: AvaliacaoApi) {
    limparAvisos();
    setAvaliacaoEmEdicao(avaliacao);
    setFormulario({
      nomeCliente: avaliacao.nome_cliente,
      descricao: avaliacao.descricao,
      estrelas: avaliacao.estrelas,
    });
    setNotaDraft(String(avaliacao.estrelas));
    setModalCadastroAberto(true);
  }

  function fecharModalCadastro() {
    if (salvando) return;
    limparAvisos();
    setModalCadastroAberto(false);
    setAvaliacaoEmEdicao(null);
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    limparAvisos();

    const nomeCliente = formulario.nomeCliente.trim();
    const descricao = formulario.descricao.trim();

    if (!nomeCliente || !descricao) {
      setErro("Preencha o nome do cliente e o texto do feedback.");
      return;
    }

    if (!notaValida(formulario.estrelas)) {
      setErro(
        `A nota precisa ser um número inteiro entre ${NOTA_MINIMA} e ${NOTA_MAXIMA}.`,
      );
      return;
    }

    setSalvando(true);
    try {
      if (avaliacaoEmEdicao) {
        const atualizada = await atualizarAvaliacaoApi(avaliacaoEmEdicao.id, {
          nome_cliente: nomeCliente,
          descricao,
          estrelas: formulario.estrelas,
        });
        setAvaliacoes((atuais) =>
          atuais.map((item) => (item.id === atualizada.id ? atualizada : item)),
        );
        setFormulario(formularioVazio);
        setNotaDraft(String(formularioVazio.estrelas));
        setModalCadastroAberto(false);
        setAvaliacaoEmEdicao(null);
        setNotificacao("Avaliação atualizada com sucesso.");
        return;
      }

      const criada = await criarAvaliacaoApi({
        nome_cliente: nomeCliente,
        descricao,
        estrelas: formulario.estrelas,
      });
      setAvaliacoes((atuais) => [criada, ...atuais]);
      setFormulario(formularioVazio);
      setNotaDraft(String(formularioVazio.estrelas));
      setModalCadastroAberto(false);
      setNotificacao("Avaliação cadastrada com sucesso.");
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(avaliacao: AvaliacaoApi) {
    limparAvisos();
    setAlterandoId(avaliacao.id);
    try {
      const atualizada = await atualizarAvaliacaoApi(avaliacao.id, {
        ativo: !avaliacao.ativo,
      });
      setAvaliacoes((atuais) =>
        atuais.map((item) => (item.id === atualizada.id ? atualizada : item)),
      );
      setNotificacao(
        atualizada.ativo
          ? "Avaliação exibida na página principal."
          : "Avaliação ocultada da página principal.",
      );
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setAlterandoId(null);
    }
  }

  async function confirmarExclusao() {
    if (!avaliacaoParaExcluir) return;

    const avaliacao = avaliacaoParaExcluir;
    setExcluindoId(avaliacao.id);
    limparAvisos();
    try {
      await excluirAvaliacaoApi(avaliacao.id);
      setAvaliacoes((atuais) =>
        atuais.filter((item) => item.id !== avaliacao.id),
      );
      setNotificacao("Avaliação excluída com sucesso.");
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setExcluindoId(null);
      setAvaliacaoParaExcluir(null);
    }
  }

  return (
    <div className={`min-h-screen bg-[#f4f6fb] ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-barlow-condensed text-sm font-black uppercase tracking-[0.24em] text-cinza-base">
              Admin
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="font-barlow-condensed text-3xl font-black uppercase text-preto-v1 sm:text-5xl">
                Avaliações
              </h1>
              <span className="rounded-full bg-[#f2f5fa] px-3.5 py-1.5 text-xs font-black uppercase text-cinza-base sm:text-sm">
                {avaliacoes.length}{" "}
                {avaliacoes.length === 1 ? "avaliação" : "avaliações"}
              </span>
              <span className="rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-black uppercase text-emerald-700 sm:text-sm">
                {visiveis} na página inicial
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {notificacao && (
              <Notificacao
                mensagem={notificacao}
                onFechar={() => setNotificacao(null)}
              />
            )}
            <button
              type="button"
              onClick={abrirModalCadastro}
              className="inline-flex items-center gap-2 rounded-xl bg-amarelo px-4 py-3 font-barlow-condensed text-sm font-black uppercase text-preto-v1 shadow-sm transition hover:brightness-95"
            >
              <Plus size={18} />
              Adicionar avaliação
            </button>
          </div>
        </div>

        <div className="mt-8">
          <section className="min-w-0 rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-sm">
            {carregando ? (
              <p className="text-sm text-cinza-base">
                Carregando avaliações...
              </p>
            ) : (
              <div className="max-h-[calc(100dvh-15rem)] space-y-3 overflow-y-auto pr-1">
                {avaliacoes.length === 0 ? (
                  <p className="text-sm text-cinza-base">
                    Nenhuma avaliação cadastrada.
                  </p>
                ) : (
                  avaliacoes.map((avaliacao) => (
                    <article
                      key={avaliacao.id}
                      className={`rounded-2xl border p-4 transition ${
                        avaliacao.ativo
                          ? "border-[#d8dee8] bg-white"
                          : "border-[#e4e7ee] bg-[#f7f8fb]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-barlow-condensed text-lg font-black uppercase text-preto-v1">
                            {avaliacao.nome_cliente}
                          </h3>
                          <Estrelas nota={avaliacao.estrelas} />
                        </div>
                        <div className="shrink-0">
                          <BadgeStatus ativo={avaliacao.ativo} />
                        </div>
                      </div>

                      <p className="mt-2 whitespace-pre-line break-words text-sm text-cinza-base">
                        {avaliacao.descricao}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => alternarStatus(avaliacao)}
                          disabled={alterandoId === avaliacao.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#d8dee8] px-3 py-2 text-[10px] font-black uppercase text-preto-v1 disabled:opacity-60"
                        >
                          {avaliacao.ativo ? (
                            <EyeOff size={12} />
                          ) : (
                            <Eye size={12} />
                          )}
                          {alterandoId === avaliacao.id
                            ? "Alterando..."
                            : avaliacao.ativo
                              ? "Desativar"
                              : "Ativar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirModalEdicao(avaliacao)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#d8dee8] px-3 py-2 text-[10px] font-black uppercase text-preto-v1"
                        >
                          <Pencil size={12} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvaliacaoParaExcluir(avaliacao)}
                          disabled={excluindoId === avaliacao.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-[10px] font-black uppercase text-red-600 disabled:opacity-60"
                        >
                          <Trash2 size={12} />
                          {excluindoId === avaliacao.id
                            ? "Excluindo..."
                            : "Excluir"}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {modalCadastroAberto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-6 sm:items-center sm:py-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-cadastro-avaliacao-titulo"
          onClick={fecharModalCadastro}
        >
          <div
            className="relative my-auto max-h-[calc(100dvh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 pt-10 shadow-xl sm:max-h-[calc(100dvh-5rem)] sm:p-6 sm:pt-10"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={fecharModalCadastro}
              aria-label={
                editando
                  ? "Fechar edição de avaliação"
                  : "Fechar cadastro de avaliação"
              }
              className="absolute right-3 top-3 text-cinza-base transition-colors hover:text-preto-v1"
            >
              <X className="size-5" strokeWidth={2} />
            </button>

            <h2
              id="modal-cadastro-avaliacao-titulo"
              className="font-barlow-condensed text-2xl font-black uppercase text-preto-v1"
            >
              {editando ? "Editar avaliação" : "Cadastrar avaliação"}
            </h2>

            <form className="mt-5 grid gap-4" onSubmit={salvar} noValidate>
              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
                  Nome do cliente
                </span>
                <div className="flex items-center gap-2 rounded-xl border border-[#d8dee8] bg-white px-3">
                  <User size={16} className="text-cinza-base" />
                  <input
                    value={formulario.nomeCliente}
                    onChange={(event) => {
                      limparAvisos();
                      setFormulario((atual) => ({
                        ...atual,
                        nomeCliente: sanitizarNome(event.target.value),
                      }));
                    }}
                    maxLength={MAX_NOME}
                    className="h-11 w-full bg-transparent outline-none"
                    placeholder="Ex.: Maria Oliveira"
                  />
                </div>
              </label>

              <label className="grid gap-1.5">
                <span className="flex items-center justify-between text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
                  Texto do feedback
                  <span
                    className={
                      formulario.descricao.length >= MAX_FEEDBACK
                        ? "text-red-600"
                        : ""
                    }
                  >
                    {formulario.descricao.length}/{MAX_FEEDBACK}
                  </span>
                </span>
                <textarea
                  value={formulario.descricao}
                  onChange={(event) => {
                    limparAvisos();
                    setFormulario((atual) => ({
                      ...atual,
                      descricao: event.target.value.slice(0, MAX_FEEDBACK),
                    }));
                  }}
                  maxLength={MAX_FEEDBACK}
                  className="min-h-28 rounded-xl border border-[#d8dee8] bg-white px-3 py-3 outline-none"
                  placeholder="Depoimento do cliente sobre a experiência"
                />
              </label>

              <div className="grid gap-1.5">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
                  Nota (de {NOTA_MINIMA} a {NOTA_MAXIMA} estrelas)
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className="flex items-center gap-1"
                    role="radiogroup"
                    aria-label="Nota da avaliação"
                  >
                    {Array.from({ length: NOTA_MAXIMA }, (_, indice) => {
                      const valor = indice + 1;
                      const preenchida = valor <= formulario.estrelas;
                      return (
                        <button
                          key={valor}
                          type="button"
                          role="radio"
                          aria-checked={valor === formulario.estrelas}
                          aria-label={`${valor} ${valor === 1 ? "estrela" : "estrelas"}`}
                          onClick={() => definirNota(valor)}
                          className="rounded-md p-1 transition hover:scale-110"
                        >
                          <Star
                            size={28}
                            strokeWidth={1.75}
                            className={
                              preenchida
                                ? "fill-amarelo text-amarelo"
                                : "text-[#c7cdd8]"
                            }
                          />
                        </button>
                      );
                    })}
                  </div>

                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
                    Nota
                    <input
                      type="number"
                      min={NOTA_MINIMA}
                      max={NOTA_MAXIMA}
                      step={1}
                      value={notaDraft}
                      onChange={(event) => digitarNota(event.target.value)}
                      onBlur={confirmarNota}
                      className="h-10 w-16 rounded-xl border border-[#d8dee8] bg-white px-3 text-center text-sm font-bold text-preto-v1 outline-none"
                    />
                  </label>
                </div>
              </div>

              {erro && (
                <p className="text-sm font-semibold text-red-600">{erro}</p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={salvando || !formularioValido}
                  className="inline-flex items-center gap-2 rounded-xl bg-preto-v1 px-5 py-3 font-barlow-condensed text-sm font-black uppercase text-white disabled:opacity-60"
                >
                  {salvando ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {salvando
                    ? "Salvando..."
                    : editando
                      ? "Salvar edição"
                      : "Cadastrar avaliação"}
                </button>
                <button
                  type="button"
                  onClick={fecharModalCadastro}
                  disabled={salvando}
                  className="rounded-xl border border-[#d8dee8] px-5 py-3 font-barlow-condensed text-sm font-black uppercase text-cinza-base disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {avaliacaoParaExcluir && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmar-exclusao-avaliacao-titulo"
          onClick={() => setAvaliacaoParaExcluir(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-branco px-8 py-10 text-center shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <p
              id="confirmar-exclusao-avaliacao-titulo"
              className="font-barlow text-lg font-bold text-preto-v1"
            >
              Tem certeza que deseja excluir esta avaliação?
            </p>
            <p className="mt-2 font-barlow text-sm text-preto-v1">
              O depoimento de &quot;{avaliacaoParaExcluir.nome_cliente}&quot;
              será removido permanentemente.
            </p>

            <div className="mt-8 flex flex-col gap-2">
              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindoId === avaliacaoParaExcluir.id}
                className="w-full rounded-md bg-red-600 py-2 font-barlow text-base font-semibold text-branco transition-colors hover:bg-red-400 disabled:opacity-60"
              >
                {excluindoId === avaliacaoParaExcluir.id
                  ? "Excluindo..."
                  : "Sim, excluir avaliação"}
              </button>
              <button
                type="button"
                onClick={() => setAvaliacaoParaExcluir(null)}
                disabled={excluindoId === avaliacaoParaExcluir.id}
                className="w-full rounded-md border border-gray-400 bg-gray-100 py-2 font-barlow text-base font-semibold text-preto-v1 transition-colors hover:bg-gray-200 disabled:opacity-60"
              >
                Não, manter avaliação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Estrelas({ nota }: { nota: number }) {
  return (
    <div
      className="mt-1 flex items-center gap-0.5"
      aria-label={`Nota ${nota} de ${NOTA_MAXIMA}`}
    >
      {Array.from({ length: NOTA_MAXIMA }, (_, indice) => (
        <Star
          key={indice}
          size={16}
          strokeWidth={1.75}
          className={
            indice < nota ? "fill-amarelo text-amarelo" : "text-[#c7cdd8]"
          }
          aria-hidden
        />
      ))}
    </div>
  );
}

function BadgeStatus({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase ${
        ativo
          ? "bg-emerald-100 text-emerald-700"
          : "bg-[#e4e7ee] text-cinza-base"
      }`}
    >
      {ativo ? "Visível no site" : "Oculta"}
    </span>
  );
}

function Notificacao({
  mensagem,
  onFechar,
}: {
  mensagem: string;
  onFechar: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onFechar, 2500);
    return () => window.clearTimeout(timer);
  }, [mensagem, onFechar]);

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50 px-6 py-4 font-barlow text-sm font-medium text-emerald-800 shadow-[0_4px_16px_rgba(16,185,129,0.1)] sm:text-base"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2
        className="h-5 w-5 shrink-0 text-emerald-600 sm:h-6 sm:w-6"
        aria-hidden
      />
      <span className="whitespace-nowrap">{mensagem}</span>
    </div>
  );
}

function mensagemErro(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}
