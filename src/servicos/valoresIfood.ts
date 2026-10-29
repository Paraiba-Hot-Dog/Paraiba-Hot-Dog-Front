/** Handshake amounts are integer cents; other order prices are already reais. */
export function reaisDoHandshake(value: string | number | undefined) {
  const text = String(value ?? '')
  if (!/^\d+$/.test(text)) return 0
  const cents = Number(text)
  return Number.isSafeInteger(cents) ? cents / 100 : 0
}

/** Tracking ETA values are durations in seconds relative to trackDate. */
export function previsaoEmSegundos(seconds: number | null | undefined, reference: number, now: number) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)
      || !Number.isFinite(reference) || !Number.isFinite(now)) return null
  const remaining = seconds - Math.max(0, (now - reference) / 1000)
  if (remaining <= 0) return seconds < 0 ? `Atrasada em ${Math.ceil(Math.abs(remaining) / 60)} min` : 'Horário previsto atingido'
  return `Em ${Math.ceil(remaining / 60)} min`
}
