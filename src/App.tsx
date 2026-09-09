import { useEffect } from 'react'
import CardapioAdm from './telas/administrador/CardapioAdm'
import Painel from './telas/administrador/Painel'
import GestaoUnidades from './telas/administrador/GestaoUnidades'
import GestaoUsuarios from './telas/administrador/GestaoUsuarios'
import GestaoBlog from './telas/administrador/GestaoBlog'
import EdicaoSobreNos from './telas/administrador/EdicaoSobreNos'
import { useAuth } from './contextos/useAuth'
import Cardapio from './telas/usuario/Cardapio'
import CartaoFidelidade from './telas/usuario/CartaoFidelidade'
import Cozinha from './telas/administrador/Cozinha'
import Dashboard from './telas/administrador/Dashboard'
import Inicio from './telas/usuario/Inicio'
import Login from './telas/usuario/Login'
import SobreNos from './telas/usuario/SobreNos'
import RecuperarSenha from './telas/usuario/RecuperarSenha'
import RedefinirSenha from './telas/usuario/RedefinirSenha'
import UnidadeAraucarias from './telas/usuario/UnidadeAraucarias'
import AnotarPedidos from './telas/administrador/AnotarPedidos'
import type { NomePermissaoApi } from './servicos/usuariosApi'

export default function App() {
  const { pathname } = window.location
  const {
    isAuthenticated,
    hasRole,
    hasPermission,
    isLoadingUser,
    permissoes,
  } = useAuth()

  useEffect(() => {
    document.title = getPageTitle(pathname)
  }, [pathname])

  if (pathname === '/admin/login') {
    if (isAuthenticated && hasRole('administrador')) {
      return <RedirectTo href="/admin" />
    }

    return <Login />
  }

  const rotaAdministrativa =
    pathname.startsWith('/admin') ||
    pathname === '/dashboard' ||
    pathname === '/cozinha'
  const permissaoRota = getRequiredPermission(pathname)

  if (rotaAdministrativa && !isAuthenticated) {
    return <Login />
  }

  if (rotaAdministrativa && isLoadingUser) {
    return <CarregandoAcesso />
  }

  if (rotaAdministrativa && !hasRole('administrador') && permissoes.length === 0) {
    return <AcessoNegado />
  }

  if (permissaoRota && !hasPermission(permissaoRota)) {
    return <AcessoNegado />
  }

  if (pathname === '/admin/configuracoes/sobre-nos' && !hasRole('administrador')) {
    return <AcessoNegado />
  }

  if (pathname === '/admin') {
    return <Painel />
  }

  if (pathname === '/admin/cardapio') {
    return <CardapioAdm />
  }

  if (pathname === '/admin/configuracoes/usuarios') {
    return <GestaoUsuarios />
  }

  if (pathname === '/admin/configuracoes/unidades') {
    return <GestaoUnidades />
  }

  if (pathname === '/admin/configuracoes/blog') {
    return <GestaoBlog />
  }

  if (pathname === '/admin/configuracoes/sobre-nos') {
    return <EdicaoSobreNos />
  }

  if (pathname === '/admin/anotar-pedidos') {
    return <AnotarPedidos />
  }

  if (pathname === '/dashboard' || pathname === '/admin/dashboard') {
    return <Dashboard />
  }

  if (pathname === '/cozinha' || pathname === '/admin/cozinha') {
    return <Cozinha />
  }

  if (pathname === '/login') {
    return <Login />
  }

  if (pathname === '/cardapio') {
    return <Cardapio />
  }

  if (pathname === '/cartao-fidelidade') {
    return <CartaoFidelidade />
  }

  if (pathname === '/sobre-nos') {
    return <SobreNos />
  }

  if (pathname === '/esqueci-senha') {
    return <RecuperarSenha />
  }

  if (pathname === '/recuperar-senha') {
    return <RedefinirSenha />
  }

  if (pathname.startsWith('/unidades/')) {
    return <UnidadeAraucarias slug={pathname.replace('/unidades/', '')} />
  }

  return <Inicio />
}

function getPageTitle(pathname: string) {
  const baseTitle = 'Paraíba Hot Dog'

  if (pathname === '/cardapio') return `Cardápio | ${baseTitle}`
  if (pathname === '/cartao-fidelidade') return `Cartão Fidelidade | ${baseTitle}`
  if (pathname === '/sobre-nos') return `Sobre Nós | ${baseTitle}`
  if (pathname.startsWith('/unidades/')) return `Unidade | ${baseTitle}`
  if (pathname === '/login' || pathname === '/admin/login') return `Login | ${baseTitle}`
  if (pathname === '/esqueci-senha' || pathname === '/recuperar-senha') {
    return `Recuperar Senha | ${baseTitle}`
  }
  if (pathname === '/admin') return `Painel Administrativo | ${baseTitle}`
  if (pathname === '/admin/cardapio') return `Cardápio Admin | ${baseTitle}`
  if (pathname === '/admin/configuracoes/usuarios') return `Usuários | ${baseTitle}`
  if (pathname === '/admin/configuracoes/unidades') return `Unidades | ${baseTitle}`
  if (pathname === '/admin/configuracoes/blog') return `Blog | ${baseTitle}`
  if (pathname === '/admin/configuracoes/sobre-nos') return `Sobre Nós | ${baseTitle}`
  if (pathname === '/admin/anotar-pedidos') return `Anotar Pedidos | ${baseTitle}`
  if (pathname === '/dashboard' || pathname === '/admin/dashboard') return `Dashboard | ${baseTitle}`
  if (pathname === '/cozinha' || pathname === '/admin/cozinha') return `Cozinha | ${baseTitle}`

  return baseTitle
}

function getRequiredPermission(pathname: string): NomePermissaoApi | null {
  if (pathname === '/admin/anotar-pedidos') return 'anotar_pedidos'
  if (pathname === '/dashboard' || pathname === '/admin/dashboard') return 'dashboard'
  if (pathname === '/cozinha' || pathname === '/admin/cozinha') return 'cozinha'
  if (pathname === '/admin/cardapio' || pathname.startsWith('/admin/configuracoes/')) {
    return 'configuracoes'
  }

  return null
}

function RedirectTo({ href }: { href: string }) {
  window.location.replace(href)
  return null
}

function CarregandoAcesso() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-branco px-6 text-center">
      <p className="font-barlow text-cinza-base">Carregando permissões...</p>
    </main>
  )
}

function AcessoNegado() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-preto-v1 px-6 text-center text-branco">
      <div>
        <h1 className="font-barlow-condensed text-4xl font-black uppercase text-amarelo">
          Acesso negado
        </h1>
        <p className="mt-3 font-barlow text-lg">
          Esta área é exclusiva para administradores.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex rounded-xl bg-amarelo px-6 py-3 font-barlow-condensed font-bold uppercase text-preto-v1"
        >
          Voltar ao início
        </a>
      </div>
    </main>
  )
}
