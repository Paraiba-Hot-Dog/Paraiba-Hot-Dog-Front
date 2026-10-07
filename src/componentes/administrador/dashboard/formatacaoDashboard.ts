export type TomVariacao = 'positive' | 'negative'

export function formatCurrency(value: string | number) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatPercentage(value: string | number) {
  const numberValue = Number(value)
  const sign = numberValue > 0 ? '+' : ''

  return `${sign}${numberValue.toLocaleString('pt-BR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 1,
  })}%`
}

export function variationTone(value: string | number): TomVariacao {
  return Number(value) < 0 ? 'negative' : 'positive'
}

/** Converte uma data para `aaaa-mm-dd` no fuso local (toISOString usaria UTC). */
export function paraDataIso(data: Date) {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${data.getFullYear()}-${mes}-${dia}`
}

export function deDataIso(dataIso: string) {
  const [ano, mes, dia = 1] = dataIso.split('-').map(Number)

  return new Date(ano, mes - 1, dia)
}

export function formatarDataBr(dataIso: string) {
  return deDataIso(dataIso).toLocaleDateString('pt-BR')
}

export function normalizarBusca(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function correspondeBusca(texto: string, busca: string) {
  const termo = normalizarBusca(busca)

  return !termo || normalizarBusca(texto).includes(termo)
}
