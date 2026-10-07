import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { DashboardApi } from '../../../servicos/dashboardApi'
import { formatPercentage } from './formatacaoDashboard'
import { CORES_GRAFICO } from './temaGraficos'

type MixProdutosProps = {
  mix: DashboardApi['mix_produtos']
}

function formatarParticipacao(valor: number) {
  return formatPercentage(valor).replace('+', '')
}

export default function MixProdutos({ mix }: MixProdutosProps) {
  // Em vez de tooltip (que cobriria o centro da rosca), a fatia sob o mouse aparece no centro.
  const [indiceAtivo, setIndiceAtivo] = useState<number | null>(null)

  const fatias: Array<{ nome: string; percentual: number; cor: string }> = mix.map((item, index) => ({
    nome: item.nome,
    percentual: Number(item.percentual),
    cor: CORES_GRAFICO.categoricas[index] ?? CORES_GRAFICO.neutra,
  }))
  // O mix vem como fatia do top 10; o que sobra vira "Outros" para o anel fechar em 100%.
  const restante = Math.max(100 - fatias.reduce((soma, fatia) => soma + fatia.percentual, 0), 0)
  if (fatias.length && restante >= 0.5) {
    fatias.push({ nome: 'Outros', percentual: restante, cor: CORES_GRAFICO.neutra })
  }
  const emFoco = indiceAtivo !== null ? fatias[indiceAtivo] : fatias[0]
  const semVendas = [{ nome: 'Sem vendas', percentual: 100, cor: CORES_GRAFICO.grade }]

  return (
    <article className="rounded-xl border border-[#d8e1ed] bg-white p-4 shadow-sm">
      <h2 className="m-0 text-xl font-black text-[#314259]">Mix de produtos</h2>

      <div className="relative mx-auto mt-2 h-[160px] w-[160px]" onMouseLeave={() => setIndiceAtivo(null)}>
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie
              cornerRadius={4}
              data={fatias.length ? fatias : semVendas}
              dataKey="percentual"
              endAngle={-270}
              innerRadius={54}
              isAnimationActive={false}
              nameKey="nome"
              onMouseEnter={(_, indice) => {
                if (fatias.length) setIndiceAtivo(indice)
              }}
              outerRadius={76}
              paddingAngle={fatias.length > 1 ? 2 : 0}
              startAngle={90}
              stroke={CORES_GRAFICO.superficie}
              strokeWidth={2}
            >
              {(fatias.length ? fatias : semVendas).map((fatia, indice) => (
                <Cell
                  className="cursor-pointer outline-none transition-opacity"
                  fill={fatia.cor}
                  fillOpacity={indiceAtivo === null || indiceAtivo === indice ? 1 : 0.3}
                  key={fatia.nome}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 grid place-items-center content-center px-9 text-center">
          <strong className="text-[26px] leading-none font-black text-[#1d2b40]">
            {emFoco ? formatarParticipacao(emFoco.percentual) : '0%'}
          </strong>
          <small className="mt-1 line-clamp-2 text-sm leading-tight font-extrabold text-[#7d8ea4]">
            {indiceAtivo !== null && emFoco ? emFoco.nome : 'Principal'}
          </small>
        </div>
      </div>

      <ul className="m-0 mt-3 grid list-none gap-0.5 p-0">
        {fatias.map((fatia, indice) => (
          <li
            className={`flex cursor-default items-center justify-between gap-3 rounded-md px-1.5 py-1 text-sm font-extrabold transition-colors ${
 indiceAtivo === indice ? 'bg-yellow-50 text-[#172033]' : 'text-[#7d8ea4]'
 }`}
            key={fatia.nome}
            onMouseEnter={() => setIndiceAtivo(indice)}
            onMouseLeave={() => setIndiceAtivo(null)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <i className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: fatia.cor }} />
              <span className="truncate">{fatia.nome}</span>
            </span>
            <strong className="text-[#1e2d42]">{formatarParticipacao(fatia.percentual)}</strong>
          </li>
        ))}
        {!fatias.length && (
          <li className="text-center text-sm font-extrabold text-[#9badc1]">Sem vendas registradas</li>
        )}
      </ul>
    </article>
  )
}
