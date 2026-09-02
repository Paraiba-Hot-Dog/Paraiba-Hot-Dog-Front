import { Info } from 'lucide-react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'

export default function EdicaoSobreNos() {
  return (
    <div className={`min-h-screen bg-[#f4f6fb] text-preto-v1 ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-[#d8dee7] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amarelo/15">
              <Info size={22} strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h1 className="font-barlow-condensed text-2xl font-bold uppercase sm:text-3xl">
                Edição de Sobre Nós
              </h1>
              <p className="font-barlow text-cinza-base/70">
                A edição desta seção estará disponível em breve.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
