import { Users } from 'lucide-react'
import OpcaoConfiguracao from './OpcaoConfiguracao'

type GestaoUsuariosProps = {
  onNavigate?: () => void
}

export default function GestaoUsuarios({ onNavigate }: GestaoUsuariosProps) {
  return (
    <OpcaoConfiguracao
      rotulo="Gestão de usuários"
      href="/admin/configuracoes/usuarios"
      icone={<Users size={36} strokeWidth={1.75} aria-hidden />}
      onNavigate={onNavigate}
    />
  )
}
