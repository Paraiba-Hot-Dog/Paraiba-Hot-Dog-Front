import { ClipboardList } from 'lucide-react'
import { useAuth } from '../../../contextos/useAuth'
import OpcaoConfiguracao from './OpcaoConfiguracao'

type AuditoriaJustificativasProps = {
  onNavigate?: () => void
}

export default function AuditoriaJustificativas({ onNavigate }: AuditoriaJustificativasProps) {
  const { hasRole } = useAuth()

  // A escrita de justificativas no back e restrita a administradores.
  if (!hasRole('administrador')) {
    return null
  }

  return (
    <OpcaoConfiguracao
      rotulo="Edição de justificativas"
      href="/admin/configuracoes/justificativas"
      icone={<ClipboardList size={36} strokeWidth={1.75} aria-hidden />}
      onNavigate={onNavigate}
    />
  )
}
