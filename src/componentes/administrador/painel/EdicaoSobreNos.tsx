import { Info } from 'lucide-react'
import { useAuth } from '../../../contextos/useAuth'
import OpcaoConfiguracao from './OpcaoConfiguracao'

type EdicaoSobreNosProps = {
  onNavigate?: () => void
}

export default function EdicaoSobreNos({ onNavigate }: EdicaoSobreNosProps) {
  const { hasRole } = useAuth()

  return (
    <OpcaoConfiguracao
      rotulo="Edição de sobre nós"
      href="/admin/configuracoes/sobre-nos"
      icone={<Info size={36} strokeWidth={1.75} aria-hidden />}
      onNavigate={onNavigate}
      disabled={!hasRole('administrador')}
    />
  )
}
