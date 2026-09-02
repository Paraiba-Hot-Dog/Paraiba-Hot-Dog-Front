import type { ReactNode } from 'react'
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
    <header className="fixed top-0 left-0 z-50 flex h-16 w-full shrink-0 items-center overflow-visible bg-preto-v1 px-6">
      <a href="/admin" aria-label="Voltar ao painel administrativo">
        <img
          src={logoBranca}
          alt="Paraíba Hot Dog"
          className="relative z-10 h-30 w-auto object-contain"
        />
      </a>

      {children && (
        <div className="flex min-w-0 flex-1 items-center justify-center px-4">{children}</div>
      )}

      {acaoDireita && <div className="ml-auto shrink-0">{acaoDireita}</div>}
    </header>
  )
}
