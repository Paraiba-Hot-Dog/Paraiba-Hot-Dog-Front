/**
 * Cores dos gráficos do dashboard. A ordem categórica (amarelo, vermelho, azul) foi validada
 * para daltonismo; o amarelo é um passo mais escuro que o #ffcc00 da marca para não sumir no
 * fundo branco. Texto nunca usa a cor da série: a identidade vem do marcador ao lado.
 */
export const CORES_GRAFICO = {
  categoricas: ['#e0a800', '#d71920', '#2f6fd6'],
  destaque: '#e0a800',
  neutra: '#c5d0de',
  grade: '#edf1f6',
  eixo: '#9badc1',
  superficie: '#ffffff',
} as const

export const ESTILO_EIXO = {
  axisLine: false,
  tickLine: false,
  tick: { fill: CORES_GRAFICO.eixo, fontSize: 14, fontWeight: 700 },
} as const

export function formatarMoedaCompacta(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  })
}
