import type { EtapaFunilAquisicao } from '../../../servicos/aquisicaoApi'

export const ROTULOS_ETAPA: Record<EtapaFunilAquisicao, string> = {
  visita_site: 'Visitou o site',
  abertura_cardapio: 'Abriu o cardápio',
  selecao_unidade: 'Escolheu a unidade',
  visualizacao_produto: 'Visualizou produto',
  clique_pedir: 'Clique para pedir',
}

export const DICAS_ETAPA: Record<EtapaFunilAquisicao, string> = {
  visita_site: 'Visitas ao site no período. Cada aba do navegador conta como uma visita.',
  abertura_cardapio: 'Visitas que abriram o cardápio pelo menos uma vez.',
  selecao_unidade: 'Visitas que escolheram uma unidade no seletor do cardápio.',
  visualizacao_produto: 'Visitas que abriram o detalhe de pelo menos um produto.',
  clique_pedir:
    'Visitas que clicaram no link do iFood. Mostra intenção de compra, não venda confirmada.',
}

const formatadorInteiro = new Intl.NumberFormat('pt-BR')
const formatadorPercentual = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function formatarNumero(valor: number) {
  return formatadorInteiro.format(valor)
}

/** Recebe o percentual da API em texto (ex.: "42.50") e devolve "42,5%". */
export function formatarPercentual(valor: string | number) {
  return `${formatadorPercentual.format(Number(valor))}%`
}
