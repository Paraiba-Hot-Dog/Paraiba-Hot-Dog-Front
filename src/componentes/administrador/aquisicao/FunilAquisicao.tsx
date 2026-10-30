import type { FunilEtapaApi } from '../../../servicos/aquisicaoApi'
import DicaInfo from './DicaInfo'
import SeloEscopo from './SeloEscopo'
import {
  DICAS_ETAPA,
  ROTULOS_ETAPA,
  formatarNumero,
  formatarPercentual,
} from './formatacaoAquisicao'

const DICA_ACIMA_DE_100 =
  'As etapas são contadas separadamente, sem ligar os eventos de uma mesma visita. ' +
  'Quando visitas pulam uma etapa (ex.: unidade já escolhida), a etapa seguinte pode ter mais visitas que a anterior.'

const DICA_UNIDADE_SOBRE_SITE =
  'Divide as visitas desta unidade pelas aberturas do cardápio no site inteiro. ' +
  'A diferença inclui quem escolheu outra unidade, por isso não conta como abandono.'

function TextoConversao({ etapa, primeira }: { etapa: FunilEtapaApi; primeira: boolean }) {
  if (primeira) return <>Etapa base</>
  if (etapa.conversao_etapa_anterior === null) return <>Taxa indisponível</>
  if (etapa.escopo_conversao === 'unidade_sobre_site') {
    return <>{formatarPercentual(etapa.conversao_etapa_anterior)} do site inteiro</>
  }
  return <>{formatarPercentual(etapa.conversao_etapa_anterior)} da anterior</>
}

function TextoPerda({ etapa, primeira }: { etapa: FunilEtapaApi; primeira: boolean }) {
  if (primeira) return null
  if (etapa.escopo_conversao === 'unidade_sobre_site') {
    if (etapa.perda > 0) return <>{formatarNumero(etapa.perda)} fora desta unidade</>
    return null
  }
  if (etapa.perda > 0) return <>−{formatarNumero(etapa.perda)} visitas</>
  if (etapa.perda < 0) return <>+{formatarNumero(-etapa.perda)} visitas</>
  return <>Sem perda</>
}

function corDaPerda(etapa: FunilEtapaApi) {
  if (etapa.escopo_conversao === 'unidade_sobre_site') return 'text-[#7d8ea4]'
  return etapa.perda > 0 ? 'text-[#d71920]' : 'text-[#078669]'
}

export default function FunilAquisicao({
  funil,
  comUnidade,
}: {
  funil: FunilEtapaApi[]
  /** Há filtro de unidade: mostra o escopo de cada etapa. */
  comUnidade: boolean
}) {
  const maiorVolume = Math.max(...funil.map((etapa) => etapa.volume), 0)
  const temAcimaDe100 = funil.some(
    (etapa) => etapa.conversao_etapa_anterior !== null && Number(etapa.conversao_etapa_anterior) > 100,
  )

  return (
    <article className="rounded-xl border border-[#d8e1ed] bg-white p-4 shadow-sm">
      <h2 className="m-0 text-base font-black text-[#314259] max-[900px]:text-lg sm:text-lg">
        Funil de conversão
      </h2>
      <p className="mt-1 text-xs font-bold text-[#9cadbf] max-[900px]:text-sm">
        Visitas que chegaram a cada etapa. Repetições na mesma visita contam uma vez.
      </p>

      <ol className="mt-4 grid gap-2.5" aria-label="Etapas do funil">
        {funil.map((etapa, indice) => {
          const primeira = indice === 0
          const ultima = indice === funil.length - 1
          const largura = maiorVolume > 0 ? (etapa.volume / maiorVolume) * 100 : 0
          const acimaDe100 =
            etapa.conversao_etapa_anterior !== null && Number(etapa.conversao_etapa_anterior) > 100
          const rotulo = ROTULOS_ETAPA[etapa.etapa]

          return (
            <li
              key={etapa.etapa}
              className={`grid gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(11rem,16rem)_minmax(0,1fr)_minmax(12rem,17rem)] sm:items-center sm:gap-4 ${
                etapa.maior_abandono
                  ? 'border-[#d71920] bg-[#fff5f6]'
                  : 'border-[#edf1f6] bg-[#fbfcfe]'
              }`}
            >
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#172033] text-[11px] font-black text-white"
                >
                  {indice + 1}
                </span>
                <span className="min-w-0 text-sm font-black text-[#243349] max-[900px]:text-base">
                  {rotulo}
                </span>
                <DicaInfo rotulo={rotulo} texto={DICAS_ETAPA[etapa.etapa]} />
                {comUnidade && <SeloEscopo escopo={etapa.escopo} />}
              </div>

              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="h-7 min-w-0 flex-1 overflow-hidden rounded-md bg-[#edf2f8]"
                  role="img"
                  aria-label={`${rotulo}: ${formatarNumero(etapa.volume)} visitas`}
                >
                  <div
                    className={`h-full rounded-md ${
                      etapa.maior_abandono ? 'bg-[#d71920]' : ultima ? 'bg-[#ffcc00]' : 'bg-[#1597ff]'
                    }`}
                    style={{ width: `${etapa.volume > 0 ? Math.max(largura, 2) : 0}%` }}
                  />
                </div>
                <strong className="w-16 shrink-0 text-right text-lg font-black text-[#223149]">
                  {formatarNumero(etapa.volume)}
                </strong>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-[#53657a] max-[900px]:text-sm sm:justify-end">
                <span className="inline-flex items-center gap-1">
                  <TextoConversao etapa={etapa} primeira={primeira} />
                  {acimaDe100 && (
                    <DicaInfo rotulo={`${rotulo} acima de 100%`} texto={DICA_ACIMA_DE_100} />
                  )}
                  {etapa.escopo_conversao === 'unidade_sobre_site' && (
                    <>
                      <SeloEscopo escopo="unidade_sobre_site" />
                      <DicaInfo rotulo={`${rotulo}: unidade ÷ site`} texto={DICA_UNIDADE_SOBRE_SITE} />
                    </>
                  )}
                </span>
                {!primeira && (
                  <span className={corDaPerda(etapa)}>
                    <TextoPerda etapa={etapa} primeira={primeira} />
                  </span>
                )}
              </div>

              {(etapa.maior_abandono || ultima) && (
                <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
                  {etapa.maior_abandono && etapa.conversao_etapa_anterior !== null && (
                    <span className="rounded bg-[#d71920] px-2 py-1 text-[11px] font-black uppercase text-white max-[900px]:text-xs">
                      Maior abandono:{' '}
                      {formatarPercentual(100 - Number(etapa.conversao_etapa_anterior))} não seguiram
                    </span>
                  )}
                  {ultima && (
                    <span className="text-[11px] font-bold text-[#725d00] max-[900px]:text-xs">
                      Intenção de compra, não venda confirmada.
                    </span>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {temAcimaDe100 && (
        <p className="mt-3 text-[11px] font-bold text-[#7d8ea4] max-[900px]:text-xs">
          Conversão acima de 100% acontece quando visitas pulam uma etapa, porque cada etapa é
          contada separadamente.
        </p>
      )}
    </article>
  )
}
