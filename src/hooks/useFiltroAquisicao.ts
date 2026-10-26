import { useCallback, useMemo } from 'react'
import {
  CANAIS_AQUISICAO,
  PERIODO_AQUISICAO_PADRAO,
  PERIODOS_AQUISICAO,
  type CanalAquisicao,
  type FiltroAquisicao,
  type PeriodoAquisicao,
} from '../servicos/aquisicaoApi'
import { useQueryParams } from './useQueryParams'

/**
 * Filtro compartilhado da aba de Aquisicao, guardado na URL:
 * `?aba=aquisicao&periodo=ultimos_30_dias&unidade=3&canal=instagram`.
 *
 * A barra de filtros altera os valores com `atualizarFiltro`; os demais
 * blocos (indicadores, funil, analises) so leem `filtro`.
 * Valores invalidos na URL caem no padrao.
 */

function lerPeriodo(valor: string | null): PeriodoAquisicao {
  return PERIODOS_AQUISICAO.find((periodo) => periodo === valor) ?? PERIODO_AQUISICAO_PADRAO
}

function lerUnidade(valor: string | null) {
  if (!valor || !/^\d+$/.test(valor)) return null
  const id = Number(valor)
  return id > 0 ? id : null
}

function lerCanal(valor: string | null): CanalAquisicao | null {
  return CANAIS_AQUISICAO.find((canal) => canal === valor) ?? null
}

export function useFiltroAquisicao() {
  const [params, atualizarQuery] = useQueryParams()
  const periodo = lerPeriodo(params.get('periodo'))
  const unidadeId = lerUnidade(params.get('unidade'))
  const canal = lerCanal(params.get('canal'))

  const filtro = useMemo<FiltroAquisicao>(
    () => ({ periodo, unidadeId, canal }),
    [periodo, unidadeId, canal],
  )

  const atualizarFiltro = useCallback(
    (mudancas: Partial<FiltroAquisicao>) => {
      atualizarQuery({
        ...('periodo' in mudancas
          ? {
              periodo:
                mudancas.periodo === PERIODO_AQUISICAO_PADRAO ? null : mudancas.periodo,
            }
          : {}),
        ...('unidadeId' in mudancas ? { unidade: mudancas.unidadeId } : {}),
        ...('canal' in mudancas ? { canal: mudancas.canal } : {}),
      })
    },
    [atualizarQuery],
  )

  return { filtro, atualizarFiltro }
}
