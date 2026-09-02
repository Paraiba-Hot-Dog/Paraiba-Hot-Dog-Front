import type { ReactNode } from 'react'

type OpcaoConfiguracaoProps = {
  rotulo: string
  href: string
  icone: ReactNode
  onNavigate?: () => void
}

export default function OpcaoConfiguracao({
  rotulo,
  href,
  icone,
  onNavigate,
}: OpcaoConfiguracaoProps) {
  return (
    <a
      href={href}
      onClick={onNavigate}
      className="flex min-h-[5rem] w-full flex-col items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-3 font-barlow-condensed text-sm font-semibold uppercase tracking-wide text-preto-v1 shadow-sm transition-all duration-200 hover:border-gray-400 hover:bg-amarelo/10 hover:shadow-md sm:min-h-[6.5rem] sm:gap-3 sm:px-4 sm:py-5 sm:text-lg"
    >
      <span className="flex h-8 items-center justify-center sm:h-10 [&_svg]:size-7 sm:[&_svg]:size-9">
        {icone}
      </span>
      {rotulo}
    </a>
  )
}
