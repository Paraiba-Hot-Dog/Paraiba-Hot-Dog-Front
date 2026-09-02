import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Menu, User, X } from 'lucide-react'
import logoBranca from '../../imagens/logos/logo-branca.png'
import logoPreta from '../../imagens/logos/logo-preta.png'

const navLinks = [
  { label: 'Cardápio', href: '/cardapio' },
  { label: 'Unidades', href: '/#unidades' },
  { label: 'Sobre nós', href: '/sobre-nos' },
  { label: 'Cartão fidelidade', href: '/cartao-fidelidade' },
] as const

const ADMIN_HREF = '/login'

const MIN_GAP_RIGHT = 20
const RIGHT_ACTION_WIDTH = 44

function NavItems({
  activeLinkClassName,
  currentLocation,
  linkClassName,
}: {
  activeLinkClassName: string
  currentLocation: string
  linkClassName: string
}) {
  const isLinkActive = (href: string) => {
    if (href === '/#unidades') {
      return currentLocation === '/#unidades' || currentLocation.startsWith('/unidades/')
    }

    return currentLocation === href
  }

  return navLinks.map(({ label, href }) => (
    <li key={href}>
      <a href={href} className={isLinkActive(href) ? activeLinkClassName : linkClassName}>
        {label}
      </a>
    </li>
  ))
}

type NavbarProps = {
  variant?: 'light' | 'dark'
}

export default function Navbar({ variant = 'light' }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [useMobileMenu, setUseMobileMenu] = useState(false)
  const currentLocation = `${window.location.pathname}${window.location.hash}`
  const isDark = variant === 'dark'
  const logo = isDark ? logoBranca : logoPreta
  const headerClassName = isDark ? 'bg-preto-v1' : 'bg-branco'
  const linkBaseClassName = 'font-barlow-condensed text-2xl font-semibold transition-colors hover:text-amarelo'
  const linkClassName = `${linkBaseClassName} ${isDark ? 'text-branco' : 'text-preto-v1'}`
  const activeLinkClassName = `${linkBaseClassName} text-amarelo`
  const iconClassName = isDark ? 'text-branco hover:text-amarelo' : 'text-preto-v1 hover:text-amarelo'
  const mobileMenuClassName = isDark
    ? 'bg-preto-v1 px-6 py-5'
    : 'bg-branco px-6 py-5'
  const linhaGradienteClassName = isDark
    ? 'h-px w-full shrink-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.28)_4%,rgba(255,255,255,0.28)_96%,transparent_100%)]'
    : 'h-px w-full shrink-0 bg-[linear-gradient(to_right,transparent_0%,rgba(26,26,26,0.12)_4%,rgba(26,26,26,0.12)_96%,transparent_100%)]'

  function LinhaDivisor({ className = '' }: { className?: string }) {
    return (
      <div
        role="separator"
        aria-hidden
        className={`${linhaGradienteClassName} ${className}`.trim()}
      />
    )
  }

  const mobileLinks = [
    ...navLinks,
    { label: 'Acesso restrito', href: ADMIN_HREF },
  ] as const

  const barRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLAnchorElement>(null)
  const measureListRef = useRef<HTMLUListElement>(null)

  const checkLayout = useCallback(() => {
    const bar = barRef.current
    const logo = logoRef.current
    const measureList = measureListRef.current

    if (!bar || !logo || !measureList) return

    const style = getComputedStyle(bar)
    const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
    const requiredNavWidth = measureList.scrollWidth
    const availableNavWidth =
      bar.clientWidth - logo.offsetWidth - paddingX - RIGHT_ACTION_WIDTH - MIN_GAP_RIGHT

    const shouldUseMobileMenu = requiredNavWidth > availableNavWidth
    setUseMobileMenu(shouldUseMobileMenu)
    if (!shouldUseMobileMenu) setIsOpen(false)
  }, [])

  useLayoutEffect(() => {
    checkLayout()
  }, [checkLayout])

  useEffect(() => {
    const targets = [barRef.current, logoRef.current, measureListRef.current].filter(
      Boolean,
    ) as Element[]

    const observer = new ResizeObserver(checkLayout)
    targets.forEach((el) => observer.observe(el))
    window.addEventListener('resize', checkLayout)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', checkLayout)
    }
  }, [checkLayout])

  useEffect(() => {
    if (!isOpen || !useMobileMenu) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, useMobileMenu])

  const toggleMenu = () => setIsOpen((open) => !open)
  const closeMenu = () => setIsOpen(false)
  const menuMobileAberto = isOpen && useMobileMenu

  return (
    <>
      {menuMobileAberto ? (
        <button
          type="button"
          className={`fixed inset-0 z-[49] backdrop-blur-sm motion-reduce:backdrop-blur-none ${
            isDark ? 'bg-black/35' : 'bg-black/15'
          }`}
          onClick={closeMenu}
          aria-label="Fechar menu"
        />
      ) : null}

      <header
        className={`fixed top-0 left-0 z-50 w-full ${headerClassName} ${isOpen ? '' : 'h-16'}`}
      >
      <div
        ref={barRef}
        className="pagina-container relative flex h-16 items-center"
      >
        {/* Lista invisível só para medir a largura necessária dos títulos */}
        <ul
          ref={measureListRef}
          className="pointer-events-none invisible absolute flex items-center gap-6 whitespace-nowrap md:gap-8 xl:gap-10"
          aria-hidden
        >
          <NavItems
            activeLinkClassName={activeLinkClassName}
            currentLocation={currentLocation}
            linkClassName={linkClassName}
          />
        </ul>

        <a
          ref={logoRef}
          href="/"
          className="relative z-10 flex h-full shrink-0 items-start"
          aria-label="Paraíba Hot Dog — início"
          onClick={closeMenu}
        >
          <img
            src={logo}
            alt="Paraíba Hot Dog"
            className="h-full max-h-full w-auto max-w-none object-contain object-left scale-180"
          />
        </a>

        {!useMobileMenu && (
          <>
            {/* Tablet / telas menores: títulos à direita (comportamento atual) */}
            <nav
              className="relative z-10 flex min-w-0 flex-1 justify-center overflow-hidden pr-2 xl:hidden"
              aria-label="Navegação principal"
            >
              <ul className="flex items-center gap-6 whitespace-nowrap md:gap-8">
                <NavItems
                  activeLinkClassName={activeLinkClassName}
                  currentLocation={currentLocation}
                  linkClassName={linkClassName}
                />
              </ul>
            </nav>

            {/* Desktop (PC): títulos centralizados na tela */}
            <nav
              className="pointer-events-none absolute inset-0 hidden items-center justify-center xl:flex"
              aria-label="Navegação principal"
            >
              <ul className="pointer-events-auto flex items-center gap-10 whitespace-nowrap">
                <NavItems
                  activeLinkClassName={activeLinkClassName}
                  currentLocation={currentLocation}
                  linkClassName={linkClassName}
                />
              </ul>
            </nav>
          </>
        )}

        {useMobileMenu && <div className="min-w-0 flex-1" aria-hidden />}

        {useMobileMenu ? (
          <button
            type="button"
            className={`relative z-10 ml-auto flex shrink-0 items-center justify-center p-2 ${iconClassName}`}
            onClick={toggleMenu}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isOpen ? <X size={32} strokeWidth={2} /> : <Menu size={32} strokeWidth={2} />}
          </button>
        ) : (
          <a
            href={ADMIN_HREF}
            className={`relative z-10 ml-auto flex shrink-0 items-center justify-center p-2 transition-colors ${iconClassName}`}
            aria-label="Acesso administrativo"
          >
            <User size={28} strokeWidth={2} />
          </a>
        )}
      </div>

      {menuMobileAberto && (
        <nav
          id="mobile-menu"
          className={mobileMenuClassName}
          aria-label="Navegação principal"
        >
          <LinhaDivisor />
          <ul className="flex flex-col">
            {mobileLinks.map(({ label, href }, index) => (
              <Fragment key={href}>
                {index > 0 ? <LinhaDivisor className="my-3" /> : null}
                <li className="py-3">
                  <a
                    href={href}
                    className={
                      href === '/#unidades'
                        ? currentLocation === '/#unidades' || currentLocation.startsWith('/unidades/')
                          ? activeLinkClassName
                          : linkClassName
                        : currentLocation === href
                          ? activeLinkClassName
                          : linkClassName
                    }
                    onClick={closeMenu}
                  >
                    {label}
                  </a>
                </li>
              </Fragment>
            ))}
          </ul>
        </nav>
      )}
    </header>
    </>
  )
}
