import { useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'

const MESES = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

type ControlesDashboardProps = {
  ano: string
  anoAtual: number
  exportando: boolean
  fechamentoMes: boolean
  filtrando: boolean
  mes: string
  onAnoChange: (ano: string) => void
  onExportarPdf: () => void
  onFechamentoMesChange: (v: boolean) => void
  onFiltrar: () => void
  onMesChange: (mes: string) => void
}

export default function ControlesDashboard({
  ano,
  anoAtual,
  exportando,
  fechamentoMes,
  filtrando,
  mes,
  onAnoChange,
  onExportarPdf,
  onFechamentoMesChange,
  onFiltrar,
  onMesChange,
}: ControlesDashboardProps) {
  const [menuAberto, setMenuAberto] = useState(true)

  return (
    <section className="mt-5 rounded-2xl border border-[#d8e1ed] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#7d8ea4] max-[900px]:text-xs">
            Fechamento do mês
          </p>
          <h2 className="mt-1 text-xl font-black text-[#172033] max-[900px]:text-2xl">
            Controles do dashboard
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setMenuAberto((valor) => !valor)}
          className="inline-flex items-center gap-2 rounded-full border border-[#d8e1ed] bg-[#f7fbff] px-3 py-2 text-sm font-black uppercase text-[#243247] transition-colors hover:border-[#1597ff] hover:text-[#1597ff] xl:hidden"
          aria-expanded={menuAberto}
          aria-controls="painel-controles-dashboard"
        >
          <SlidersHorizontal size={14} />
          Agrupar ações
          <ChevronDown size={14} className={`transition-transform ${menuAberto ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div
        id="painel-controles-dashboard"
        className={`${menuAberto ? 'mt-4 block' : 'hidden'} xl:mt-4 xl:block`}
      >
        <div className="grid gap-3 lg:grid-cols-[auto_140px_160px_auto_auto] lg:items-end">
          <button
            className={`h-11 w-full rounded-xl border-2 px-4 text-sm font-black uppercase transition-colors lg:w-auto ${
              fechamentoMes
                ? 'border-[#1597ff] bg-[#1597ff] text-white'
                : 'border-[#d8e1ed] bg-white text-[#243247] hover:border-[#1597ff]'
            }`}
            onClick={() => onFechamentoMesChange(!fechamentoMes)}
            type="button"
          >
            {fechamentoMes ? '✓ Fechamento do mês' : 'Fechamento do mês'}
          </button>

          <label className="grid gap-1.5 text-[11px] font-black uppercase text-[#7d8ea4] max-[900px]:text-xs">
            Ano
            <input
              className="h-11 w-full rounded-xl border border-[#d8e1ed] bg-white px-3 text-base font-black text-[#243247] outline-none focus:border-[#1597ff] disabled:cursor-not-allowed disabled:opacity-50 max-[900px]:text-lg"
              disabled={fechamentoMes}
              inputMode="numeric"
              max={anoAtual}
              min="2000"
              onChange={(e) => onAnoChange(e.target.value)}
              placeholder={String(anoAtual)}
              type="number"
              value={ano}
            />
          </label>

          <label className="grid gap-1.5 text-[11px] font-black uppercase text-[#7d8ea4] max-[900px]:text-xs">
            Mês
            <select
              className="h-11 w-full rounded-xl border border-[#d8e1ed] bg-white px-3 text-base font-black text-[#243247] outline-none focus:border-[#1597ff] disabled:cursor-not-allowed disabled:opacity-50 max-[900px]:text-lg"
              disabled={fechamentoMes}
              onChange={(e) => onMesChange(e.target.value)}
              value={mes}
            >
              <option value="">Todos</option>
              {MESES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <button
            className="h-11 w-full rounded-xl bg-[#ef000c] px-5 text-sm font-black uppercase text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
            disabled={exportando}
            onClick={onExportarPdf}
            type="button"
          >
            {exportando ? 'Baixando...' : 'Exportar PDF'}
          </button>

          <button
            className="h-11 w-full rounded-xl bg-[#ef000c] px-5 text-sm font-black uppercase text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
            disabled={filtrando}
            onClick={onFiltrar}
            type="button"
          >
            {filtrando ? 'Filtrando...' : 'Filtrar'}
          </button>
        </div>
      </div>
    </section>
  )
}
