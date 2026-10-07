import { deDataIso, formatarDataBr, paraDataIso } from './formatacaoDashboard'

export type IntervaloDatas = {
  dataInicio: string
  dataFim: string
}

export const ATALHOS_PERIODO = [
  { id: 'hoje', rotulo: 'Hoje' },
  { id: 'ultimos-7-dias', rotulo: 'Últimos 7 dias' },
  { id: 'ultimos-30-dias', rotulo: 'Últimos 30 dias' },
  { id: 'mes-atual', rotulo: 'Este mês' },
  { id: 'mes-anterior', rotulo: 'Fechamento do mês' },
  { id: 'ano-atual', rotulo: 'Este ano' },
] as const

export type AtalhoPeriodo = (typeof ATALHOS_PERIODO)[number]['id']

export function intervaloDoAtalho(atalho: AtalhoPeriodo, hoje = new Date()): IntervaloDatas {
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  const diasAtras = (dias: number) => new Date(ano, mes, hoje.getDate() - dias)

  switch (atalho) {
    case 'hoje':
      return { dataInicio: paraDataIso(hoje), dataFim: paraDataIso(hoje) }
    case 'ultimos-7-dias':
      return { dataInicio: paraDataIso(diasAtras(6)), dataFim: paraDataIso(hoje) }
    case 'ultimos-30-dias':
      return { dataInicio: paraDataIso(diasAtras(29)), dataFim: paraDataIso(hoje) }
    case 'mes-atual':
      return { dataInicio: paraDataIso(new Date(ano, mes, 1)), dataFim: paraDataIso(hoje) }
    case 'mes-anterior':
      return {
        dataInicio: paraDataIso(new Date(ano, mes - 1, 1)),
        dataFim: paraDataIso(new Date(ano, mes, 0)),
      }
    case 'ano-atual':
      return { dataInicio: paraDataIso(new Date(ano, 0, 1)), dataFim: paraDataIso(hoje) }
  }
}

export function atalhoDoIntervalo({ dataInicio, dataFim }: IntervaloDatas): AtalhoPeriodo | null {
  const atalho = ATALHOS_PERIODO.find(({ id }) => {
    const intervalo = intervaloDoAtalho(id)
    return intervalo.dataInicio === dataInicio && intervalo.dataFim === dataFim
  })

  return atalho?.id ?? null
}

export function validarIntervalo({ dataInicio, dataFim }: IntervaloDatas) {
  if (!dataInicio || !dataFim) return 'Informe a data inicial e a data final.'
  if (dataInicio > dataFim) return 'A data inicial não pode ser depois da data final.'

  return null
}

export function descreverIntervalo({ dataInicio, dataFim }: IntervaloDatas) {
  if (dataInicio === dataFim) return formatarDataBr(dataInicio)

  return `${formatarDataBr(dataInicio)} a ${formatarDataBr(dataFim)}`
}

function ultimoDiaDoMes(data: Date) {
  return new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate()
}

/**
 * Nome do período para o título do relatório: o mês ("setembro de 2026") ou o ano ("2026")
 * quando o intervalo cobre exatamente um deles — ou vai do início dele até hoje —; senão as datas.
 */
export function nomearPeriodo({ dataInicio, dataFim }: IntervaloDatas, hoje = paraDataIso(new Date())) {
  const inicio = deDataIso(dataInicio)
  const fim = deDataIso(dataFim)
  const mesmoMes = inicio.getFullYear() === fim.getFullYear() && inicio.getMonth() === fim.getMonth()
  const mesmoAno = inicio.getFullYear() === fim.getFullYear()
  const terminaHoje = dataFim === hoje

  if (dataInicio === dataFim) return formatarDataBr(dataInicio)
  if (mesmoMes && inicio.getDate() === 1 && (fim.getDate() === ultimoDiaDoMes(fim) || terminaHoje)) {
    return inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }
  if (mesmoAno && inicio.getMonth() === 0 && inicio.getDate() === 1) {
    const fimDoAno = fim.getMonth() === 11 && fim.getDate() === 31
    if (fimDoAno || terminaHoje) return String(inicio.getFullYear())
  }

  return descreverIntervalo({ dataInicio, dataFim })
}

/** Ex.: "01/10/2026 a 06/10/2026 · 6 dias (parcial)". "Parcial" quando o período ainda está em andamento. */
export function detalharPeriodo(intervalo: IntervaloDatas, hoje = paraDataIso(new Date())) {
  const dias = Math.round((deDataIso(intervalo.dataFim).getTime() - deDataIso(intervalo.dataInicio).getTime()) / 86_400_000) + 1
  const nome = nomearPeriodo(intervalo, hoje)
  const parcial = intervalo.dataFim === hoje && !nome.includes('/') && dias > 1

  return `${descreverIntervalo(intervalo)} · ${dias} ${dias === 1 ? 'dia' : 'dias'}${parcial ? ' (parcial)' : ''}`
}

/** Rótulo curto de um ponto da série de vendas: `14/09` por dia ou `set/26` por mês. */
export function rotuloPeriodo(periodo: string, agrupamento: 'dia' | 'mes') {
  const data = deDataIso(periodo)

  if (agrupamento === 'dia') {
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const mes = data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return `${mes}/${String(data.getFullYear()).slice(2)}`
}
