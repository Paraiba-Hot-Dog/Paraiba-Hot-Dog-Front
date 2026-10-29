import { useEffect, useState } from 'react'

export function useAgora(intervalo = 1000) {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setAgora(Date.now()), intervalo)
    return () => window.clearInterval(timer)
  }, [intervalo])
  return agora
}

export function tempoRestante(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const horas = Math.floor(total / 3600)
  const minutos = Math.floor((total % 3600) / 60)
  const segundos = total % 60
  if (horas > 0) return `${horas}h ${String(minutos).padStart(2, '0')}min`
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
}
