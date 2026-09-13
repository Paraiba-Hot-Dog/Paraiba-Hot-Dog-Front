import { Star } from 'lucide-react'
import OpcaoConfiguracao from './OpcaoConfiguracao'

type EdicaoAvaliacaoProps = {
  onNavigate?: () => void
}

export default function EdicaoAvaliacao({ onNavigate }: EdicaoAvaliacaoProps) {
  return (
    <OpcaoConfiguracao
      rotulo="Avaliações"
      href="/admin/configuracoes/avaliacoes"
      icone={<Star size={36} strokeWidth={1.75} aria-hidden />}
      onNavigate={onNavigate}
    />
  )
}
