import { useEffect, useState } from 'react'
import { ArrowLeft, History, LoaderCircle } from 'lucide-react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import {
  formatarTelefone,
  listarHistoricoPontosApi,
  obterClienteApi,
  type ClienteApi,
  type HistoricoAjustePontosApi,
} from '../../servicos/clientesApi'

type HistoricoPontosClienteProps = {
  clienteId: number
}

export default function HistoricoPontosCliente({ clienteId }: HistoricoPontosClienteProps) {
  const [cliente, setCliente] = useState<ClienteApi | null>(null)
  const [historico, setHistorico] = useState<HistoricoAjustePontosApi[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true

    Promise.all([obterClienteApi(clienteId), listarHistoricoPontosApi(clienteId)])
      .then(([dadosCliente, dadosHistorico]) => {
        if (!ativo) return
        setCliente(dadosCliente)
        setHistorico(dadosHistorico)
      })
      .catch((error) => {
        if (ativo) setErro(error instanceof Error ? error.message : 'Não foi possível carregar o histórico.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [clienteId, tentativa])

  function tentarNovamente() {
    setCarregando(true)
    setErro('')
    setTentativa((atual) => atual + 1)
  }

  return (
    <div className={`min-h-screen bg-[#edf2f8] text-preto-v1 ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin />
      <main className="mx-auto w-full max-w-360 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <a
          href="/admin/configuracoes/clientes"
          className="mb-4 inline-flex items-center gap-1 font-barlow text-sm font-semibold text-cinza-base transition hover:text-preto-v1"
        >
          <ArrowLeft size={16} aria-hidden />
          Voltar para clientes
        </a>

        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amarelo/20">
              <History className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="font-barlow-condensed text-3xl font-bold uppercase">
                Histórico de pontos{cliente && `: ${cliente.nome}`}
              </h1>
              {cliente ? (
                <p className="font-barlow text-sm text-cinza-base/75">
                  {formatarTelefone(cliente.telefone)} · {cliente.email || 'E-mail não informado'}
                </p>
              ) : (
                <p className="font-barlow text-sm text-cinza-base/75">Alterações no saldo de pontos do cliente.</p>
              )}
            </div>
          </div>

          {cliente && (
            <div className="rounded-xl border border-[#d8dee7] bg-white px-5 py-3 text-right">
              <span className="block font-barlow text-xs font-bold uppercase tracking-wider text-cinza-base/70">
                Saldo atual
              </span>
              <span className="font-barlow text-2xl font-bold">{cliente.pontos_fidelidade}</span>
            </div>
          )}
        </header>

        <section className="overflow-hidden rounded-2xl border border-[#d8dee7] bg-white shadow-sm" aria-label="Histórico de alterações de pontos">
          {carregando ? (
            <div className="flex min-h-56 items-center justify-center gap-2 font-barlow text-cinza-base">
              <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> Carregando histórico...
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
          ) : historico.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center px-4 text-center font-barlow text-cinza-base">
              Nenhuma alteração de pontos registrada para este cliente.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-200 border-collapse text-left">
                <thead className="bg-[#f7f9fc]">
                  <tr className="border-b border-[#e2e6ec] font-barlow text-xs font-bold uppercase tracking-wider text-cinza-base/70">
                    <th className="px-5 py-4">Data</th>
                    <th className="px-5 py-4 text-right">Pontos alterados</th>
                    <th className="px-5 py-4">Justificativa</th>
                    <th className="px-5 py-4">Responsável</th>
                    <th className="px-5 py-4 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((ajuste) => (
                    <tr key={ajuste.id} className="border-b border-[#eef1f5] align-top last:border-0">
                      <td className="whitespace-nowrap px-5 py-4 font-barlow text-sm text-cinza-base">
                        {formatarDataHora(ajuste.data_ajuste)}
                      </td>
                      <td className="px-5 py-4 text-right font-barlow font-bold">
                        <span className={ajuste.quantidade > 0 ? 'text-emerald-700' : 'text-red-600'}>
                          {ajuste.quantidade > 0 ? `+${ajuste.quantidade}` : ajuste.quantidade}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-barlow text-sm">
                        <span className="font-semibold">{ajuste.motivo.descricao}</span>
                        {!ajuste.motivo.ativo && (
                          <span className="ml-2 rounded-full bg-[#eef1f5] px-2 py-0.5 text-[10px] font-bold uppercase text-cinza-base">
                            Desativada
                          </span>
                        )}
                        {ajuste.observacao && (
                          <p className="mt-1 text-cinza-base">{ajuste.observacao}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 font-barlow text-sm text-cinza-base">
                        {ajuste.usuario_nome ?? 'Não identificado'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-barlow text-sm text-cinza-base">
                        {ajuste.pontos_anterior} → <strong className="text-preto-v1">{ajuste.pontos_atual}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function formatarDataHora(dataIso: string) {
  const data = new Date(dataIso)
  if (Number.isNaN(data.getTime())) return dataIso
  return `${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}
