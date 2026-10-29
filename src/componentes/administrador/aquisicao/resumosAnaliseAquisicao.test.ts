import { describe, expect, it } from 'vitest'
import type { OrigemCanalApi, ProdutoVisualizadoApi, UnidadeComparacaoApi } from '../../../servicos/aquisicaoApi'
import {
  descreverRecorte,
  nomeDaUnidade,
  resumirAcoes,
  resumirFiltrosAtivos,
  resumirOrigem,
  resumirProdutos,
  resumirUnidades,
} from './resumosAnaliseAquisicao'

function origem(canal: OrigemCanalApi['canal'], visitantes: number, participacao: string | null): OrigemCanalApi {
  return {
    canal,
    visitantes,
    participacao,
    cliques_pedir: 0,
    escopo_cliques: 'site',
    taxa_visita_clique: null,
    escopo_taxa: 'site',
  }
}

function produto(rank: number, nome: string, visualizacoes: number): ProdutoVisualizadoApi {
  return { rank, produto_id: rank, nome, visualizacoes, escopo: 'site' }
}

function unidade(unidade_id: number | null, nome: string, escolhas: number, participacao: string | null) {
  return {
    unidade_id,
    nome,
    escolhas,
    participacao_escolhas: participacao,
    cliques_pedir: 0,
    taxa_escolha_clique: null,
  } satisfies UnidadeComparacaoApi
}

describe('resumos das analises', () => {
  it('descreve o recorte com os padroes', () => {
    const filtro = { periodo: 'ultimos_30_dias', unidadeId: null, canal: null } as const
    expect(descreverRecorte(filtro, null)).toEqual(['Últimos 30 dias', 'Todas as unidades', 'Todos os canais'])
  })

  it('resume os filtros ativos como no chip', () => {
    const filtro = { periodo: 'ultimos_30_dias', unidadeId: 2, canal: 'instagram' } as const
    const nome = nomeDaUnidade([{ id: 2, nome: 'Águas Claras' }], 2)
    expect(resumirFiltrosAtivos(filtro, nome)).toBe('Águas Claras · Instagram')
    expect(nomeDaUnidade([], 9)).toBe('Unidade #9')
  })

  it('aponta o canal que lidera', () => {
    expect(resumirOrigem([origem('instagram', 20, '50.00'), origem('busca', 38, '95.00')])).toBe(
      'Busca lidera com 95,0% dos acessos.',
    )
    expect(resumirOrigem([origem('direto', 0, null)])).toBe('Nenhum acesso registrado neste recorte.')
  })

  it('resume as acoes com e sem visitas', () => {
    const base = { escopo_acoes_por_visita: 'site' as const, por_tipo: [] }
    expect(resumirAcoes({ ...base, total_acoes: 240, acoes_por_visita: '6.00' })).toBe(
      '240 ações no recorte, 6 por visita.',
    )
    expect(resumirAcoes({ ...base, total_acoes: 1, acoes_por_visita: null })).toBe('1 ação no recorte.')
    expect(resumirAcoes({ ...base, total_acoes: 0, acoes_por_visita: null })).toBe(
      'Nenhuma ação registrada neste recorte.',
    )
  })

  it('resume o produto lider e o empate', () => {
    expect(resumirProdutos([produto(1, 'Monster XL', 7), produto(2, 'Batata', 3)])).toBe(
      'Monster XL é o mais visualizado, com 7 visualizações.',
    )
    expect(resumirProdutos([produto(1, 'A', 40), produto(1, 'B', 40)])).toBe(
      '2 produtos empatam na liderança, com 40 visualizações cada.',
    )
    expect(resumirProdutos([])).toBe('Nenhum produto visualizado neste recorte.')
  })

  it('ignora a linha sem unidade ao resumir unidades', () => {
    expect(
      resumirUnidades([unidade(null, 'Sem unidade ou removida', 0, '0.00'), unidade(1, 'Asa Sul', 40, '100.00')]),
    ).toBe('Asa Sul concentra 100,0% das escolhas de unidade.')
    expect(resumirUnidades([])).toBe('Nenhuma unidade escolhida neste recorte.')
  })
})
