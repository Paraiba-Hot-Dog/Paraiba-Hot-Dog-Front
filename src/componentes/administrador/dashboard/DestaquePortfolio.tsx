import { Flame } from 'lucide-react'
import type { DashboardApi } from '../../../servicos/dashboardApi'
import { formatPercentage } from './formatacaoDashboard'

type DestaquePortfolioProps = {
  destaque: DashboardApi['destaque']
}

export default function DestaquePortfolio({ destaque }: DestaquePortfolioProps) {
  const margens = [
    { rotulo: 'Fatia da receita bruta', valor: destaque?.margem_ganho ?? 0 },
    { rotulo: 'Fatia do lucro líquido', valor: destaque?.margem_liquida ?? 0 },
  ]

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-xl bg-[#c91521] p-4 text-white shadow-sm">
      <Flame aria-hidden className="absolute -right-6 -bottom-6 text-white/10" size={140} strokeWidth={1.5} />

      <span className="inline-flex w-fit items-center gap-1.5 rounded bg-white/20 px-2.5 py-1.5 text-sm font-black uppercase">
        <Flame size={15} strokeWidth={3} />
        Destaque do portfólio
      </span>
      <h2 className="mt-3.5 mb-1 text-3xl leading-tight font-black text-white">{destaque?.nome ?? 'Sem vendas'}</h2>
      <p className="m-0 text-sm font-bold text-white/70">Produto mais vendido no período.</p>

      <div className="relative mt-auto grid grid-cols-2 gap-4 pt-6">
        {margens.map((margem) => (
          <div key={margem.rotulo}>
            <strong className="block text-[34px] leading-none font-black">
              {formatPercentage(margem.valor).replace('+', '')}
            </strong>
            <small className="mt-1.5 block text-sm font-extrabold text-white/70">
              {margem.rotulo}
            </small>
            <div className="mt-2 h-1.5 rounded-full bg-white/20">
              <div className="h-1.5 rounded-full bg-[#ffcc00]" style={{ width: `${Math.min(Number(margem.valor), 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}
