import type {
  AcoesGeradasApi,
  FiltroAquisicao,
  OrigemCanalApi,
  ProdutoVisualizadoApi,
  UnidadeComparacaoApi,
} from '../../../servicos/aquisicaoApi'
import {
  ROTULOS_CANAL,
  ROTULOS_PERIODO,
  formatarNumero,
  formatarPercentual,
  formatarRazao,
} from './formatacaoAquisicao'

function plural(quantidade: number, singular: string, varios: string) {
  return `${formatarNumero(quantidade)} ${quantidade === 1 ? singular : varios}`
}

export function nomeDaUnidade(unidades: { id: number; nome: string }[], unidadeId: number | null) {
  if (unidadeId === null) return null
  return unidades.find((unidade) => unidade.id === unidadeId)?.nome ?? `Unidade #${unidadeId}`
}

export function descreverRecorte(filtro: FiltroAquisicao, nomeUnidade: string | null) {
  return [
    ROTULOS_PERIODO[filtro.periodo],
    nomeUnidade ?? 'Todas as unidades',
    filtro.canal === null ? 'Todos os canais' : ROTULOS_CANAL[filtro.canal],
  ]
}

export function resumirFiltrosAtivos(filtro: FiltroAquisicao, nomeUnidade: string | null) {
  return [nomeUnidade, filtro.canal === null ? null : ROTULOS_CANAL[filtro.canal]]
    .filter(Boolean)
    .join(' · ')
}

export function resumirOrigem(origem: OrigemCanalApi[]) {
  const lider = origem.reduce<OrigemCanalApi | null>(
    (melhor, linha) => (melhor === null || linha.visitantes > melhor.visitantes ? linha : melhor),
    null,
  )
  if (!lider || lider.visitantes === 0 || lider.participacao === null) {
    return 'Nenhum acesso registrado neste recorte.'
  }
  return `${ROTULOS_CANAL[lider.canal]} lidera com ${formatarPercentual(lider.participacao)} dos acessos.`
}

export function resumirAcoes(acoes: AcoesGeradasApi) {
  if (acoes.total_acoes === 0) return 'Nenhuma ação registrada neste recorte.'
  const total = plural(acoes.total_acoes, 'ação', 'ações')
  if (acoes.acoes_por_visita === null) return `${total} no recorte.`
  return `${total} no recorte, ${formatarRazao(acoes.acoes_por_visita)} por visita.`
}

export function resumirProdutos(produtos: ProdutoVisualizadoApi[]) {
  const lideres = produtos.filter((produto) => produto.rank === 1)
  if (!lideres.length) return 'Nenhum produto visualizado neste recorte.'
  const visualizacoes = plural(lideres[0].visualizacoes, 'visualização', 'visualizações')
  if (lideres.length === 1) return `${lideres[0].nome} é o mais visualizado, com ${visualizacoes}.`
  return `${lideres.length} produtos empatam na liderança, com ${visualizacoes} cada.`
}

export function resumirUnidades(unidades: UnidadeComparacaoApi[]) {
  const lider = unidades.find(
    (unidade) => unidade.unidade_id !== null && unidade.escolhas > 0 && unidade.participacao_escolhas !== null,
  )
  if (!lider || lider.participacao_escolhas === null) return 'Nenhuma unidade escolhida neste recorte.'
  return `${lider.nome} concentra ${formatarPercentual(lider.participacao_escolhas)} das escolhas de unidade.`
}
