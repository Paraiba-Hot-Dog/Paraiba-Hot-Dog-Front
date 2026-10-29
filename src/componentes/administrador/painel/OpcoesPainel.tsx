import type { ReactElement } from 'react'
import {
  ChefHat,
  ClipboardPen,
  Database,
  Search,
  Settings,
  Wrench,
} from 'lucide-react'
import { useAuth } from '../../../contextos/useAuth'
import type { NomePermissaoApi } from '../../../servicos/usuariosApi'
import BotaoOpcaoPainel from './BotaoOpcaoPainel'

type OpcaoPainel = {
  rotulo: string
  href?: string
  permissao: NomePermissaoApi
  icone: ReactElement
}

const opcoesPainel: OpcaoPainel[] = [
  {
    rotulo: 'Anotar Pedidos',
    href: '/admin/anotar-pedidos',
    permissao: 'anotar_pedidos',
    icone: <ClipboardPen size={36} strokeWidth={1.75} aria-hidden />,
  },
  {
    rotulo: 'Pedidos',
    href: '/admin/pedidos',
    permissao: 'anotar_pedidos',
    icone: <ClipboardPen size={36} strokeWidth={1.75} aria-hidden />,
  },
  {
    rotulo: 'Cozinha',
    href: '/admin/cozinha',
    permissao: 'cozinha',
    icone: <ChefHat size={36} strokeWidth={1.75} aria-hidden />,
  },
  {
    rotulo: 'Dashboard',
    href: '/admin/dashboard',
    permissao: 'dashboard',
    icone: (
      <span className="relative inline-flex h-9 w-9 items-center justify-center">
        <Database size={32} strokeWidth={1.75} aria-hidden />
        <Search
          size={18}
          strokeWidth={2}
          className="absolute -bottom-0.5 -right-0.5"
          aria-hidden
        />
      </span>
    ),
  },
  {
    rotulo: 'Configurações',
    href: '/admin/configuracoes',
    permissao: 'configuracoes',
    icone: (
      <span className="relative inline-flex h-9 w-9 items-center justify-center">
        <Settings size={30} strokeWidth={1.75} aria-hidden />
        <Wrench
          size={20}
          strokeWidth={1.75}
          className="absolute -bottom-0.5 -right-1 rotate-12"
          aria-hidden
        />
      </span>
    ),
  },
]

export default function OpcoesPainel() {
  const { hasPermission } = useAuth()

  return (
    <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
      {opcoesPainel.map(({ rotulo, href, icone, permissao }) => {
        const permitido = rotulo === 'Pedidos' ? hasPermission('anotar_pedidos') || hasPermission('cozinha') : hasPermission(permissao)

        return (
          <BotaoOpcaoPainel
            key={rotulo}
            rotulo={rotulo}
            href={href ?? '/admin/configuracoes'}
            icone={icone}
            disabled={!permitido}
          />
        )
      })}
    </div>
  )
}
