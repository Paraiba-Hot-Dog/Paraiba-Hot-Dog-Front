import { useEffect, useState } from 'react'
import { useFiltroAquisicao } from '../../../hooks/useFiltroAquisicao'
import { getAquisicao, type AquisicaoApi } from '../../../servicos/aquisicaoApi'

type EstadoCarregamento =
  | { status: 'carregando' }
  | { status: 'erro'; mensagem: string }
  | { status: 'pronto'; dados: AquisicaoApi }

/**
 * Bloco de indicadores e funil da aba de Aquisição (Pessoa A).
 * Lê o filtro compartilhado; a apresentação final entra na Fase 6.
 */
export default function IndicadoresEFunilAquisicao() {
  const { filtro } = useFiltroAquisicao()
  const [estado, setEstado] = useState<EstadoCarregamento>({ status: 'carregando' })

  useEffect(() => {
    const controller = new AbortController()

    getAquisicao(filtro, controller.signal)
      .then((dados) => setEstado({ status: 'pronto', dados }))
      .catch((erro: unknown) => {
        if (erro instanceof DOMException && erro.name === 'AbortError') return
        setEstado({
          status: 'erro',
          mensagem: erro instanceof Error ? erro.message : 'Erro inesperado ao carregar a aquisição.',
        })
      })

    return () => controller.abort()
  }, [filtro])

  if (estado.status === 'carregando') {
    return (
      <div className="rounded border border-[#ffdb38] bg-[#fff1a6] px-3 py-2.5 text-xs font-extrabold text-[#604f00]">
        Carregando dados de aquisição da API...
      </div>
    )
  }

  if (estado.status === 'erro') {
    return (
      <div className="rounded border border-[#f4a5ad] bg-[#ffe4e7] px-3 py-2.5 text-xs font-extrabold text-[#8a1018]">
        {estado.mensagem}
      </div>
    )
  }

  const { indicadores, funil } = estado.dados

  return (
    <section
      className="rounded-xl border border-[#d8e1ed] bg-white p-4 shadow-sm"
      aria-label="Indicadores e funil de aquisição"
    >
      <dl className="grid grid-cols-2 gap-3 text-sm font-bold text-[#53657a] sm:grid-cols-5">
        <div><dt>Visitantes</dt><dd className="text-xl font-black text-[#223149]">{indicadores.visitantes}</dd></div>
        <div><dt>Visualizações do cardápio</dt><dd className="text-xl font-black text-[#223149]">{indicadores.visualizacoes_cardapio}</dd></div>
        <div><dt>Produtos visualizados</dt><dd className="text-xl font-black text-[#223149]">{indicadores.produtos_visualizados}</dd></div>
        <div><dt>Cliques para pedir</dt><dd className="text-xl font-black text-[#223149]">{indicadores.cliques_pedir}</dd></div>
        <div><dt>Taxa visita → clique</dt><dd className="text-xl font-black text-[#223149]">{indicadores.taxa_visita_clique ?? '—'}</dd></div>
      </dl>
      <ol className="mt-4 grid gap-1 text-sm text-[#53657a]">
        {funil.map((etapa) => (
          <li key={etapa.etapa}>{etapa.etapa}: {etapa.volume}</li>
        ))}
      </ol>
    </section>
  )
}
