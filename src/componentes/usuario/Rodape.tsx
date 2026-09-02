import logo from '../../imagens/logos/logo-preta.png'
import iconeCacto from '../../imagens/outros/cacto-rodape.svg'
import RedesSociais from './RedesSociais'

const linksAcessoRapido = [
  { label: 'Cardápio', href: '/cardapio' },
  { label: 'Sobre nós', href: '/sobre-nos' },
  { label: 'Cartão fidelidade', href: '/cartao-fidelidade' },
] as const

function LinksAcessoRapidoHorizontal({
  className = '',
  alinharInicio = false,
}: {
  className?: string
  alinharInicio?: boolean
}) {
  return (
    <nav aria-label="Acesso rápido" className={className}>
      <ul
        className={`mx-auto flex w-fit flex-wrap items-center gap-x-2 gap-y-1 ${
          alinharInicio ? 'justify-start' : 'justify-center'
        }`}
      >
        {linksAcessoRapido.map(({ label, href }, index) => (
          <li key={href} className="flex items-center gap-2">
            {index > 0 && (
              <span className="font-barlow text-amarelo" aria-hidden>
                •
              </span>
            )}
            <a
              href={href}
              className="font-barlow text-base text-preto-v1 transition-opacity hover:opacity-70 min-[490px]:text-[clamp(1rem,1rem+(100vw-30.625rem)*0.0012,1.125rem)]"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function Rodape() {
  return (
    <footer className="bg-branco">
      <div className="pagina-container pt-2 pb-2 min-[490px]:pt-6 min-[490px]:pb-4 lg:pt-8 lg:pb-6">
        <div className="min-[490px]:hidden">
          <div className="flex items-center justify-center gap-3" data-footer-socials>
            <RedesSociais
              variant="plain"
              mostrar="ifood"
              className="justify-center [&_img]:h-7 [&_a]:min-h-7 [&_a]:min-w-7"
            />

            <span className="font-barlow text-base text-cinza-base" aria-hidden>
              •
            </span>

            <a href="/" aria-label="Paraíba Hot Dog — início" className="block shrink-0 leading-none">
              <img
                src={logo}
                alt="Paraíba Hot Dog"
                className="block h-16 w-auto object-contain object-top"
              />
            </a>

            <span className="font-barlow text-base text-cinza-base" aria-hidden>
              •
            </span>

            <RedesSociais
              variant="plain"
              mostrar="instagram"
              className="justify-center [&_img]:h-7 [&_a]:min-h-7 [&_a]:min-w-7"
            />
          </div>

          <div className="flex w-full justify-center">
            <div className="inline-grid w-fit max-w-full justify-items-stretch">
              <div
                className="invisible col-start-1 row-start-1 pointer-events-none select-none"
                aria-hidden
              >
                <LinksAcessoRapidoHorizontal />
              </div>

              <p className="col-start-1 row-start-1 w-full whitespace-nowrap text-justify font-barlow-condensed text-[clamp(1.05rem,5.2vw,1.45rem)] font-black uppercase leading-none text-preto-v1 [text-align-last:justify]">
                O DOG MAIS <span className="text-amarelo">ARRETADO</span> DE BRASÍLIA
              </p>

              <LinksAcessoRapidoHorizontal className="col-start-1 row-start-2 mt-7" />
            </div>
          </div>
        </div>

        <div className="hidden w-full min-w-0 flex-col items-center gap-6 min-[490px]:flex min-[490px]:flex-row min-[490px]:items-center min-[490px]:justify-between min-[490px]:gap-6 lg:gap-10 xl:gap-12">
          <div className="flex w-full min-w-0 flex-row items-center gap-4 lg:gap-8">
            <div className="flex items-center gap-3 lg:gap-5">
              <a href="/" aria-label="Paraíba Hot Dog — início">
                <img
                  src={logo}
                  alt="Paraíba Hot Dog"
                  className="h-20 w-auto object-contain lg:h-24"
                />
              </a>

              <p className="font-barlow-condensed text-[clamp(1.25rem,3.5vw,2rem)] font-black uppercase leading-[0.95] text-preto-v1">
                O DOG MAIS
                <br />
                <span className="text-amarelo">ARRETADO</span>
                <br />
                DE BRASÍLIA
              </p>
            </div>

            <div className="flex flex-col justify-center">
              <h3 className="font-barlow-condensed text-2xl font-semibold text-preto-v1">
                Acesso rápido
              </h3>

              <ul className="mt-1 flex flex-col gap-1">
                {linksAcessoRapido.map(({ label, href }) => (
                  <li key={href}>
                    <a
                      href={href}
                      className="flex items-center gap-1 font-barlow text-lg leading-none text-preto-v1 transition-opacity hover:opacity-70 lg:text-xl"
                    >
                      <img
                        src={iconeCacto}
                        alt=""
                        aria-hidden
                        className="h-5 w-auto shrink-0"
                      />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div data-footer-socials>
            <RedesSociais variant="circulo" className="justify-end" />
          </div>
        </div>

        <hr className="mt-4 h-px border-0 bg-gradient-to-r from-transparent via-preto-v3/20 to-transparent min-[490px]:mt-5" />
        <p className="mt-2 text-center font-barlow text-sm text-cinza-botao min-[490px]:text-base">
          © 2026 Paraíba Hot Dog. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
