import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import IndicadoresEFunilAquisicao from '../../componentes/administrador/aquisicao/IndicadoresEFunilAquisicao'

/**
 * Aba "Aquisição e conversão" do BI.
 *
 * Pontos de encaixe, em ordem. Cada bloco e um componente proprio que le o
 * filtro com `useFiltroAquisicao` (src/hooks/useFiltroAquisicao.ts):
 *   1. Barra de filtros (Pessoa B) — altera o filtro com `atualizarFiltro`.
 *   2. Indicadores e funil (Pessoa A).
 *   3. Secoes de analise (Pessoa B).
 */
export default function PainelAquisicao() {
  return (
    <>
      <BarraDeNavegacaoAdmin />

      <main
        className={`${CLASSE_OFFSET_BARRA_ADMIN} min-h-screen overflow-x-hidden bg-[#edf2f8] text-[#243247]`}
      >
        <section
          className="min-h-[calc(100vh-4rem)] w-full bg-[#edf2f8]"
          aria-label="Aquisição e conversão"
        >
          <div className="min-h-[calc(100vh-4rem)] px-[6vw] py-7 max-[900px]:px-3.5 max-[900px]:py-4">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.24em] text-[#7d8ea4] max-[900px]:text-xs sm:text-sm">
                Tela do BI
              </span>
              <h1 className="m-0 font-barlow-condensed text-3xl font-black uppercase tracking-wide text-[#172033] sm:text-4xl xl:text-5xl">
                Aquisição e conversão
              </h1>
            </div>

            <div className="grid gap-4">
              {/* 1. Barra de filtros (Pessoa B) */}

              <IndicadoresEFunilAquisicao />

              {/* 3. Seções de análise (Pessoa B) */}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
