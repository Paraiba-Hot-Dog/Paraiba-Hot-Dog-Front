import { MapPin } from 'lucide-react'
import OpcaoConfiguracao from './OpcaoConfiguracao'

type EdicaoUnidadesProps = {
  onNavigate?: () => void
}

export default function EdicaoUnidades({ onNavigate }: EdicaoUnidadesProps) {
  return (
    <OpcaoConfiguracao
      rotulo="Edição de unidades"
      href="/admin/configuracoes/unidades"
      icone={<MapPin size={36} strokeWidth={1.75} aria-hidden />}
      onNavigate={onNavigate}
    />
  )
}
