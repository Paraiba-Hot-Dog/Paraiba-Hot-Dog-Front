import { Info } from 'lucide-react'
import OpcaoConfiguracao from './OpcaoConfiguracao'

type EdicaoSobreNosProps = {
  onNavigate?: () => void
}

export default function EdicaoSobreNos({ onNavigate }: EdicaoSobreNosProps) {
  return (
    <OpcaoConfiguracao
      rotulo="Edição de Sobre Nós"
      href="/admin/configuracoes/sobre-nos"
      icone={<Info size={36} strokeWidth={1.75} aria-hidden />}
      onNavigate={onNavigate}
    />
  )
}
