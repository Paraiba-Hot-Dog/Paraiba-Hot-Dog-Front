import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, LoaderCircle, Search, Users } from 'lucide-react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import { listarClientesApi, type ClienteApi } from '../../servicos/clientesApi'

const TAMANHO_PAGINA = 10
const ATRASO_BUSCA_MS = 200

type Ordenacao = {
  campo: 'nome' | 'email' | 'telefone' | 'pontos_fidelidade'
  direcao: 'asc' | 'desc'
}

export default function GestaoClientes() {
  const [clientes, setClientes] = useState<ClienteApi[]>([])
  const [pagina, setPagina] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')
  const [ordenacao] = useState<Ordenacao>({
    campo: 'nome',
    direcao: 'asc',
  })
  const [temProximaPagina, setTemProximaPagina] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    const termo = busca.trim()
    if (termo === buscaAplicada) return

    const temporizador = setTimeout(() => {
      setCarregando(true)
      setErro('')
      setPagina(0)
      setBuscaAplicada(termo)
    }, ATRASO_BUSCA_MS)

    return () => clearTimeout(temporizador)
  }, [busca, buscaAplicada])

  useEffect(() => {
    let ativo = true

    listarClientesApi({
      skip: pagina * TAMANHO_PAGINA,
      limit: TAMANHO_PAGINA + 1,
      busca: buscaAplicada || undefined,
    })
      .then((dados) => {
        if (!ativo) return
        setTemProximaPagina(dados.length > TAMANHO_PAGINA)
        setClientes(dados.slice(0, TAMANHO_PAGINA))
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [pagina, buscaAplicada, tentativa])

  function voltarPagina() {
    setCarregando(true)
    setErro('')
    setPagina((atual) => Math.max(0, atual - 1))
  }

  function avancarPagina() {
    if (!temProximaPagina) return
    setCarregando(true)
    setErro('')
    setPagina((atual) => atual + 1)
  }

  function tentarNovamente() {
    setCarregando(true)
    setErro('')
    setTentativa((atual) => atual + 1)
  }

  const inicio = pagina * TAMANHO_PAGINA + 1
  const fim = pagina * TAMANHO_PAGINA + clientes.length

  return (
    <div className={`min-h-screen bg-[#edf2f8] text-preto-v1 ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin />
      <main className="mx-auto w-full max-w-360 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amarelo/20">
              <Users className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="font-barlow-condensed text-3xl font-bold uppercase">Clientes</h1>
              <p className="font-barlow text-sm text-cinza-base/75">
                Consulte o saldo atual de pontos dos clientes.
              </p>
            </div>
          </div>

          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Buscar clientes</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cinza-base/60" aria-hidden />
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone"
              className="w-full rounded-xl border border-[#d8dee7] bg-white py-3 pl-10 pr-3 font-barlow text-sm text-cinza-base outline-none transition focus:border-amarelo"
            />
          </label>
        </header>

        <section className="overflow-hidden rounded-2xl border border-[#d8dee7] bg-white shadow-sm" aria-label="Lista de clientes">
          {carregando ? (
            <div className="flex min-h-56 items-center justify-center gap-2 font-barlow text-cinza-base">
              <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> Carregando clientes...
            </div>
          ) : erro ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-4 text-center">
              <p className="font-barlow text-cinza-base">{erro}</p>
              <button
                type="button"
                onClick={tentarNovamente}
                className="rounded-lg bg-preto-v1 px-4 py-2 font-barlow-condensed font-bold uppercase text-white transition hover:bg-cinza-botao"
              >
                Tentar novamente
              </button>
            </div>
          ) : clientes.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center px-4 text-center font-barlow text-cinza-base">
              {buscaAplicada
                ? `Nenhum cliente encontrado para "${buscaAplicada}".`
                : 'Nenhum cliente cadastrado.'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-160 border-collapse text-left">
                  <thead className="bg-[#f7f9fc]">
                    <tr className="border-b border-[#e2e6ec] font-barlow text-xs font-bold uppercase tracking-wider text-cinza-base/70">
                      <th
                        className="px-5 py-4"
                        aria-sort={ordenacao.campo === 'nome' ? ordenacao.direcao === 'asc' ? 'ascending' : 'descending' : 'none'}
                      >
                        Nome
                      </th>
                      <th className="px-5 py-4">E-mail</th>
                      <th className="px-5 py-4">Telefone</th>
                      <th className="px-5 py-4 text-right">Saldo de pontos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((cliente) => (
                      <tr key={cliente.id} className="border-b border-[#eef1f5] last:border-0">
                        <td className="px-5 py-4 font-barlow font-semibold">{cliente.nome}</td>
                        <td className="px-5 py-4 font-barlow text-sm text-cinza-base">{cliente.email || 'Não informado'}</td>
                        <td className="px-5 py-4 font-barlow text-sm text-cinza-base">{formatarTelefone(cliente.telefone)}</td>
                        <td className="px-5 py-4 text-right font-barlow font-bold">{cliente.pontos_fidelidade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <footer className="flex flex-col gap-3 border-t border-[#e2e6ec] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-barlow text-sm text-cinza-base/75">
                  Exibindo {inicio}-{fim}
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={voltarPagina}
                    disabled={pagina === 0 || carregando}
                    aria-label="Página anterior"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d8dee7] text-preto-v1 transition hover:bg-[#f7f9fc] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden />
                  </button>
                  <span className="min-w-20 text-center font-barlow text-sm font-semibold">Página {pagina + 1}</span>
                  <button
                    type="button"
                    onClick={avancarPagina}
                    disabled={!temProximaPagina || carregando}
                    aria-label="Próxima página"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d8dee7] text-preto-v1 transition hover:bg-[#f7f9fc] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

function formatarTelefone(telefone: string) {
  const numeros = telefone.replace(/\D/g, '')
  if (numeros.length === 11) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
  if (numeros.length === 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
  return telefone
}

function mensagemErro(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível carregar os clientes.'
}