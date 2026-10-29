import { AlarmClock } from 'lucide-react'
import { dataHora, dataPedido } from '../../servicos/pedidoApresentacao'
import { tempoRestante, useAgora } from '../../servicos/useAgora'

const AVISO_MS = 3 * 60_000

/** Countdown for the 8-minute confirmation window; the iFood cancels the order automatically when it ends. */
export function PrazoConfirmacao({ prazo, agendado, compacto }: { prazo?: string | null; agendado?: boolean; compacto?: boolean }) {
  const agora = useAgora()
  const fim = dataPedido(prazo)?.getTime()
  if (!fim) return null
  const restante = fim - agora
  // Scheduled orders only open the window near the preparation time.
  if (agendado && restante > 60 * 60_000) {
    return <p className="text-xs text-slate-600">Agendado · confirmar até {dataHora(prazo)}</p>
  }
  const esgotado = restante <= 0
  const urgente = !esgotado && restante <= AVISO_MS
  const cor = esgotado ? 'bg-red-600 text-white' : urgente ? 'bg-red-50 text-red-800 ring-1 ring-red-200' : 'bg-amber-50 text-amber-900'
  const texto = esgotado ? 'Prazo de confirmação esgotado' : `Confirmar em ${tempoRestante(restante)}`
  // The visible clock ticks every second; only threshold changes are announced to screen readers.
  return <p className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold ${compacto ? 'text-[11px]' : 'text-sm'} ${cor} ${urgente ? 'motion-safe:animate-pulse' : ''}`}>
    <AlarmClock size={compacto ? 13 : 16} className="shrink-0" aria-hidden />
    <span>{texto}{!compacto && !esgotado && <span className="font-normal"> · até {dataHora(prazo)}</span>}{esgotado && !compacto && <span className="block font-normal">O iFood pode cancelar o pedido automaticamente. Confira no Gestor.</span>}</span>
    <span role="alert" className="sr-only">{esgotado ? 'Prazo de confirmação esgotado' : urgente ? 'Menos de 3 minutos para confirmar o pedido' : ''}</span>
  </p>
}
