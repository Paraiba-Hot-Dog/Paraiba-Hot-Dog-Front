import { Newspaper } from 'lucide-react'
import OpcaoConfiguracao from './OpcaoConfiguracao'

type EdicaoBlogProps = {
  onNavigate?: () => void
}

export default function EdicaoBlog({ onNavigate }: EdicaoBlogProps) {
  return (
    <OpcaoConfiguracao
      rotulo="Noticias e promoções"
      href="/admin/configuracoes/blog"
      icone={<Newspaper size={36} strokeWidth={1.75} aria-hidden />}
      onNavigate={onNavigate}
    />
  )
}
