import { useCallback, useRef, useState } from 'react'
import { ArrowRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { deDataIso, formatarDataBr, paraDataIso } from './formatacaoDashboard'
import type { IntervaloDatas } from './periodoDashboard'
import { useFecharAoClicarFora } from './useFecharAoClicarFora'

type SeletorPeriodoProps = IntervaloDatas & {
  /** Última data selecionável (aaaa-mm-dd). */
  max: string
  onChange: (intervalo: IntervaloDatas) => void
}

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function primeiroDoMes(dataIso: string) {
  const data = deDataIso(dataIso)
  return new Date(data.getFullYear(), data.getMonth(), 1)
}

/** 42 dias (6 semanas) a partir do domingo anterior ao dia 1 do mês. */
function diasDoCalendario(mes: Date) {
  const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1 - mes.getDay())
  return Array.from({ length: 42 }, (_, indice) => {
    const dia = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + indice)
    return { iso: paraDataIso(dia), dia: dia.getDate(), doMes: dia.getMonth() === mes.getMonth() }
  })
}

function ordenar(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a]
}

export default function SeletorPeriodo({ dataInicio, dataFim, max, onChange }: SeletorPeriodoProps) {
  const [aberto, setAberto] = useState(false)
  const [mesVisivel, setMesVisivel] = useState(() => primeiroDoMes(dataFim || max))
  // Primeiro clique guarda o início aqui; o segundo fecha o intervalo.
  const [inicioEscolhido, setInicioEscolhido] = useState<string | null>(null)
  const [diaSobMouse, setDiaSobMouse] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hoje = paraDataIso(new Date())

  const fechar = useCallback(() => {
    setAberto(false)
    setInicioEscolhido(null)
  }, [])

  useFecharAoClicarFora(aberto, containerRef, fechar)

  function abrir() {
    setMesVisivel(primeiroDoMes(dataFim || max))
    setInicioEscolhido(null)
    setAberto(true)
  }

  function escolher(iso: string) {
    if (inicioEscolhido === null) {
      setInicioEscolhido(iso)
      return
    }

    const [inicio, fim] = ordenar(inicioEscolhido, iso)
    onChange({ dataInicio: inicio, dataFim: fim })
    fechar()
  }

  function mudarMes(delta: number) {
    setMesVisivel((atual) => new Date(atual.getFullYear(), atual.getMonth() + delta, 1))
  }

  const [inicioVisivel, fimVisivel] = inicioEscolhido
    ? ordenar(inicioEscolhido, diaSobMouse ?? inicioEscolhido)
    : [dataInicio, dataFim]
  const proximoMesBloqueado = paraDataIso(new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + 1, 1)) > max
  const tituloMes = mesVisivel.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-label={`Período: ${formatarDataBr(dataInicio)} até ${formatarDataBr(dataFim)}`}
        className={`flex h-12 w-full items-center gap-2 rounded-xl border bg-white px-3 text-left transition-colors ${
 aberto ? 'border-[#1597ff] ring-3 ring-[#1597ff]/15' : 'border-[#d8e1ed] hover:border-[#b9c6d6]'
 }`}
        onClick={() => (aberto ? fechar() : abrir())}
        type="button"
      >
        <CalendarDays aria-hidden className="shrink-0 text-[#9badc1]" size={18} />
        <span className="flex min-w-0 flex-1 items-center gap-2 text-[15px] font-bold whitespace-nowrap text-[#172033]">
          {formatarDataBr(dataInicio)}
          <ArrowRight aria-hidden className="shrink-0 text-[#9badc1]" size={15} />
          {formatarDataBr(dataFim)}
        </span>
        <ChevronDown
          aria-hidden
          className={`shrink-0 text-[#9badc1] transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
          size={16}
        />
      </button>

      {aberto && (
        <div
          aria-label="Escolher período"
          className="absolute top-[calc(100%+6px)] left-0 z-30 w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border border-[#d8e1ed] bg-white p-3 shadow-lg"
          role="dialog"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              aria-label="Mês anterior"
              className="grid h-9 w-9 place-items-center rounded-lg text-[#3a4a60] transition-colors hover:bg-yellow-50"
              onClick={() => mudarMes(-1)}
              type="button"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-[15px] font-black text-[#172033] first-letter:uppercase">{tituloMes}</span>
            <button
              aria-label="Próximo mês"
              className="grid h-9 w-9 place-items-center rounded-lg text-[#3a4a60] transition-colors hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
              disabled={proximoMesBloqueado}
              onClick={() => mudarMes(1)}
              type="button"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center" onMouseLeave={() => setDiaSobMouse(null)}>
            {DIAS_SEMANA.map((dia, indice) => (
              <span className="pb-1.5 text-xs font-black text-[#9badc1]" key={`${dia}-${indice}`}>
                {dia}
              </span>
            ))}

            {diasDoCalendario(mesVisivel).map(({ iso, dia, doMes }) => {
              const bloqueado = iso > max
              const extremo = iso === inicioVisivel || iso === fimVisivel
              const noIntervalo = iso > inicioVisivel && iso < fimVisivel

              return (
                <button
                  aria-label={formatarDataBr(iso)}
                  aria-pressed={extremo}
                  className={`relative my-0.5 h-9 transition-colors disabled:cursor-not-allowed ${
                    extremo
                      ? 'rounded-lg bg-[#ffcc00] text-black'
                      : noIntervalo
                        ? 'bg-[#fff6cc] text-[#172033]'
                        : bloqueado
                          ? 'text-[#d5dde7]'
                          : `rounded-lg hover:bg-yellow-50 ${doMes ? 'text-[#243247]' : 'text-[#b8c4d3]'}`
                  }`}
                  disabled={bloqueado}
                  key={iso}
                  onClick={() => escolher(iso)}
                  onMouseEnter={() => setDiaSobMouse(iso)}
                  type="button"
                >
                  <span className={`text-sm ${extremo ? 'font-black' : 'font-semibold'}`}>{dia}</span>
                  {iso === hoje && !extremo && (
                    <i aria-hidden className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#e0a800]" />
                  )}
                </button>
              )
            })}
          </div>

          <p className="m-0 mt-2 border-t border-[#edf1f6] pt-2.5 text-center text-sm font-bold text-[#7d8ea4]">
            {inicioEscolhido
              ? `Início em ${formatarDataBr(inicioEscolhido)}. Agora escolha o fim.`
              : 'Clique na data inicial e depois na final.'}
          </p>
        </div>
      )}
    </div>
  )
}
