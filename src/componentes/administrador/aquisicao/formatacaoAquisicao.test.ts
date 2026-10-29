import { describe, expect, it } from 'vitest'
import { CANAIS_AQUISICAO } from '../../../servicos/aquisicaoApi'
import {
  ROTULOS_CANAL,
  contarFiltrosAtivos,
  formatarPercentual,
  formatarRazao,
} from './formatacaoAquisicao'

describe('formatacaoAquisicao', () => {
  it('tem rotulo em portugues para todos os canais', () => {
    expect(CANAIS_AQUISICAO.map((canal) => ROTULOS_CANAL[canal])).toEqual([
      'Instagram',
      'QR Code',
      'Outras campanhas',
      'Busca',
      'Outros sites',
      'Direto',
    ])
  })

  it('formata razao sem casas desnecessarias', () => {
    expect(formatarRazao('6.00')).toBe('6')
    expect(formatarRazao('4.75')).toBe('4,75')
    expect(formatarRazao('2.50')).toBe('2,5')
  })

  it('formata percentual da API', () => {
    expect(formatarPercentual('50.00')).toBe('50,0%')
    expect(formatarPercentual('26.67')).toBe('26,67%')
  })

  it('conta so unidade e canal como filtros ativos', () => {
    expect(contarFiltrosAtivos({ periodo: 'ultimos_7_dias', unidadeId: null, canal: null })).toBe(0)
    expect(contarFiltrosAtivos({ periodo: 'ultimos_30_dias', unidadeId: 3, canal: null })).toBe(1)
    expect(contarFiltrosAtivos({ periodo: 'ultimos_90_dias', unidadeId: 3, canal: 'instagram' })).toBe(2)
  })
})
