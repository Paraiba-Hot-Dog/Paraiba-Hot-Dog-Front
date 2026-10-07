import type { ReactNode } from 'react'

type LinhaTooltip = {
  cor?: string
  rotulo: string
  valor: ReactNode
}

type TooltipDashboardProps = {
  linhas: LinhaTooltip[]
  titulo: ReactNode
}

export default function TooltipDashboard({ linhas, titulo }: TooltipDashboardProps) {
  return (
    <div className="min-w-40 rounded-lg border border-[#d8e1ed] bg-white px-3 py-2.5 shadow-lg">
      <p className="m-0 mb-1.5 text-sm font-black uppercase tracking-[0.12em] text-[#7d8ea4]">{titulo}</p>
      {linhas.map((linha) => (
        <div className="flex items-center justify-between gap-4 text-sm font-bold text-[#53657a]" key={linha.rotulo}>
          <span className="flex items-center gap-1.5">
            {linha.cor && <i className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: linha.cor }} />}
            {linha.rotulo}
          </span>
          <strong className="font-black text-[#223149]">{linha.valor}</strong>
        </div>
      ))}
    </div>
  )
}
