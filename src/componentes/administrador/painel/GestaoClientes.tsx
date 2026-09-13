import { Users } from 'lucide-react'
import OpcaoConfiguracao from './OpcaoConfiguracao'

type GestaoClientesProps = {
  onNavigate?: () => void
}

export default function GestaoClientes({ onNavigate }: GestaoClientesProps) {
  return (
    <OpcaoConfiguracao
      rotulo="Gestão de clientes"
      href="/admin/configuracoes/clientes"
      icone={<Users size={36} strokeWidth={1.75} aria-hidden />}
      onNavigate={onNavigate}
    />
  )
}