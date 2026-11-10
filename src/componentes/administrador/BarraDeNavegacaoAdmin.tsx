import type { ReactNode } from 'react'
import { Store } from 'lucide-react'
import logoBranca from '../../imagens/logos/logo-branca.png'

export const CLASSE_OFFSET_BARRA_ADMIN = 'pt-16'

type BarraDeNavegacaoAdminProps = {
  children?: ReactNode
  acaoDireita?: ReactNode
}

export default function BarraDeNavegacaoAdmin({
  children,
  acaoDireita,
}: BarraDeNavegacaoAdminProps) {
  return (
    <header className="fixed top-0 left-0 z-50 flex h-16 w-full max-w-full shrink-0 items-center overflow-visible bg-preto-v1 px-3 sm:px-6">
      <a href="/admin" aria-label="Voltar ao painel administrativo" className="flex shrink-0 items-center">
        <img
          src={logoBranca}
          alt="Paraíba Hot Dog"
          className="relative z-10 h-16 w-auto max-h-16 max-w-[110px] object-contain sm:h-28 sm:max-h-20 sm:max-w-none"
        />
      </a>

      {children && (
        <div className="flex min-w-0 flex-1 items-center justify-center px-2 sm:px-4">{children}</div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
        <a
          href="/"
          className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-2.5 py-1.5 font-barlow text-xs font-semibold text-white/90 shadow-sm transition-all hover:border-amarelo hover:bg-amarelo hover:text-preto-v1 sm:gap-2 sm:px-3.5"
          aria-label="Ver o site público"
        >
          <Store size={15} strokeWidth={2} aria-hidden />
          <span className="hidden sm:inline">Ver site</span>
        </a>

        {acaoDireita}
      </div>
    </header>
  )
}
