import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  HelpCircle,
  Info,
  MapPin,
  Newspaper,
  Star,
  UserCheck,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import { useAuth } from '../../contextos/useAuth'

type OpcaoConfig = {
  titulo: string
  descricao: string
  href: string
  icone: LucideIcon
  somenteAdmin?: boolean
}

const secaoGestao: OpcaoConfig[] = [
  {
    titulo: 'Gestão de usuários',
    descricao: 'Colaboradores, cargos e permissões de acesso ao sistema',
    href: '/admin/configuracoes/usuarios',
    icone: Users,
  },
  {
    titulo: 'Gestão de clientes',
    descricao: 'Base de clientes cadastrados, dados de contato e fidelidade',
    href: '/admin/configuracoes/clientes',
    icone: UserCheck,
  },
  {
    titulo: 'Edição de justificativas',
    descricao: 'Motivos permitidos para alterações manuais de pontos de clientes',
    href: '/admin/configuracoes/justificativas',
    icone: ClipboardList,
    somenteAdmin: true,
  },
]

const secaoConteudo: OpcaoConfig[] = [
  {
    titulo: 'Edição do cardápio',
    descricao: 'Lanches, combos, adicionais, variações e categorias do menu',
    href: '/admin/cardapio',
    icone: UtensilsCrossed,
  },
  {
    titulo: 'Gestão do blog',
    descricao: 'Notícias, novidades, lançamentos e promoções no site',
    href: '/admin/configuracoes/blog',
    icone: Newspaper,
  },
  {
    titulo: 'Edição de unidades',
    descricao: 'Filiais, endereços, horários de funcionamento e mapa do Google',
    href: '/admin/configuracoes/unidades',
    icone: MapPin,
  },
  {
    titulo: 'Edição de sobre nós',
    descricao: 'História, valores da empresa e fotos institucionais da marca',
    href: '/admin/configuracoes/sobre-nos',
    icone: Info,
    somenteAdmin: true,
  },
  {
    titulo: 'Edição de avaliações',
    descricao: 'Feedbacks e depoimentos de clientes em destaque na home',
    href: '/admin/configuracoes/avaliacoes',
    icone: Star,
  },
  {
    titulo: 'Dúvidas frequentes',
    descricao: 'Perguntas e respostas para orientar os visitantes do site',
    href: '/admin/configuracoes/duvidas-frequentes',
    icone: HelpCircle,
  },
]

export default function Configuracoes() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole('administrador')

  const itensGestao = secaoGestao.filter((item) => !item.somenteAdmin || isAdmin)
  const itensConteudo = secaoConteudo.filter((item) => !item.somenteAdmin || isAdmin)

  return (
    <div className={`flex min-h-screen flex-col bg-[#f5f7fb] text-preto-v1 ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <a
          href="/admin"
          className="group inline-flex items-center gap-2 font-barlow text-sm font-semibold text-cinza-base transition-colors hover:text-preto-v1"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Voltar ao painel
        </a>

        <header className="mt-4 border-b border-slate-200 pb-6">
          <p className="font-barlow-condensed text-xs font-bold uppercase tracking-[0.2em] text-cinza-base sm:text-sm">
            Painel Administrativo
          </p>
          <h1 className="mt-1 font-barlow-condensed text-3xl font-black uppercase text-preto-v1 sm:text-5xl">
            Configurações
          </h1>
          <p className="mt-2 font-barlow text-sm text-cinza-base sm:text-base">
            Selecione uma área para gerenciar o conteúdo do site ou as configurações operacionais da loja.
          </p>
        </header>

        <div className="mt-8 space-y-10">
          {/* Seção Gestão e Pessoas */}
          <section>
            <div className="mb-4">
              <h2 className="font-barlow-condensed text-xl font-bold uppercase tracking-wide text-preto-v1 sm:text-2xl">
                Gestão e Pessoas
              </h2>
              <p className="font-barlow text-xs text-cinza-base sm:text-sm">
                Administração de unidades, colaboradores e clientes.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
              {itensGestao.map((opcao) => (
                <CardConfiguracao key={opcao.href} opcao={opcao} />
              ))}
            </div>
          </section>

          {/* Seção Conteúdo do Site */}
          <section>
            <div className="mb-4">
              <h2 className="font-barlow-condensed text-xl font-bold uppercase tracking-wide text-preto-v1 sm:text-2xl">
                Conteúdo do Site
              </h2>
              <p className="font-barlow text-xs text-cinza-base sm:text-sm">
                Textos, cardápio, notícias e informações exibidas ao público.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
              {itensConteudo.map((opcao) => (
                <CardConfiguracao key={opcao.href} opcao={opcao} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function CardConfiguracao({ opcao }: { opcao: OpcaoConfig }) {
  const Icone = opcao.icone

  return (
    <a
      href={opcao.href}
      className="group relative flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amarelo hover:shadow-md sm:p-5"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amarelo/15 text-preto-v1 transition-colors group-hover:bg-amarelo group-hover:text-preto-v1">
        <Icone size={24} strokeWidth={2} aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-barlow-condensed text-lg font-bold uppercase text-preto-v1 group-hover:text-amarelo-hover transition-colors sm:text-xl">
          {opcao.titulo}
        </h3>
        <p className="mt-0.5 line-clamp-2 font-barlow text-xs text-cinza-base/80 sm:text-sm">
          {opcao.descricao}
        </p>
      </div>

      <ChevronRight
        size={20}
        className="shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-preto-v1"
        aria-hidden
      />
    </a>
  )
}

