import { CircleQuestionMark } from 'lucide-react'
import OpcaoConfiguracao from './OpcaoConfiguracao'

type EdicaoDuvidasFrequentesProps = {
  onNavigate?: () => void
}

export default function EdicaoDuvidasFrequentes({
  onNavigate,
}: EdicaoDuvidasFrequentesProps) {
  return (
    <OpcaoConfiguracao
      rotulo="Dúvidas frequentes"
      href="/admin/configuracoes/duvidas-frequentes"
      icone={<CircleQuestionMark size={36} strokeWidth={1.75} aria-hidden />}
      onNavigate={onNavigate}
    />
  )
}
