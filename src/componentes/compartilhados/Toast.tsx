import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'

export type Notificacao = { id: number; mensagem: string; tipo: 'sucesso' }

export default function Toast({ notificacao, onFechar }: { notificacao: Notificacao; onFechar: () => void }) {
  const fecharRef = useRef(onFechar)
  const restante = useRef(5000)
  const [hover, setHover] = useState(false)
  const [foco, setFoco] = useState(false)
  useEffect(() => { fecharRef.current = onFechar }, [onFechar])
  useEffect(() => { restante.current = 5000 }, [notificacao.id])
  useEffect(() => {
    if (hover || foco) return
    const inicio = Date.now()
    const timer = window.setTimeout(() => fecharRef.current(), restante.current)
    return () => {
      window.clearTimeout(timer)
      restante.current = Math.max(0, restante.current - (Date.now() - inicio))
    }
  }, [notificacao.id, hover, foco])
  return <div role="status" aria-live="polite" aria-atomic="true"
    onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    onFocus={() => setFoco(true)} onBlur={(evento) => { if (!evento.currentTarget.contains(evento.relatedTarget)) setFoco(false) }}
    className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 left-4 z-[120] flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-lg sm:left-auto sm:max-w-md lg:bottom-6">
    <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0" /><span>{notificacao.mensagem}</span>
    <button type="button" onClick={onFechar} aria-label="Fechar mensagem" className="ml-auto rounded p-2 focus-visible:outline-2"><X aria-hidden size={18} /></button>
  </div>
}
