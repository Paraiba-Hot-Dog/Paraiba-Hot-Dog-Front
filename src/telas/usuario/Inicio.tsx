import { useEffect, useState } from "react";
import BarraDeNavegacao from "../../componentes/usuario/BarraDeNavegacaoUsuario";
import Botao from "../../componentes/usuario/inicio/Botao";
import BotaoUnidade from "../../componentes/usuario/inicio/BotaoUnidade";
import DuvidasFrequentes from "../../componentes/usuario/inicio/DuvidasFrequentes";
import RedesSociais from "../../componentes/usuario/RedesSociais";
import Rodape from "../../componentes/usuario/Rodape";
import CarrosselNossosDogs from "../../componentes/usuario/inicio/CarrosselNossosDogs";
import imgSmashHome from "../../imagens/logos/img-smash-home.svg";
import {
  criarSlugUnidade,
  listarUnidades,
  resolverUrlImagem,
  type Unidade,
} from "../../servicos/api";

const IFOOD_URL =
  "https://www.ifood.com.br/delivery/brasilia-df/paraiba-hot-dog-sul-aguas-claras/6b414c09-98ff-427f-9c06-1b00ad1438fe";

const hotDogsCards = [
  {
    image: resolverUrlImagem("/uploads/produtos/smash-facheiro.jpeg")!,
    title: "Smash Facheiro",
    alt: "Smash Facheiro",
  },
  {
    image: resolverUrlImagem("/uploads/produtos/smash-mandacaru.jpeg")!,
    title: "Smash Mandacaru",
    alt: "Smash Mandacaru",
  },
  {
    image: resolverUrlImagem("/uploads/produtos/smash-xiquexique.jpeg")!,
    title: "Smash Xique-Xique",
    alt: "Smash Xique-Xique",
  },
  {
    image: resolverUrlImagem("/uploads/produtos/dog-arretado.jpeg")!,
    title: "Dog Arretado",
    alt: "Hot Dog Arretado",
  },
  {
    image: resolverUrlImagem("/uploads/produtos/dog-paraibano.jpeg")!,
    title: "Dog Paraibano",
    alt: "Hot Dog Paraibano",
  },
  {
    image: resolverUrlImagem("/uploads/produtos/dog-tradicional.jpeg")!,
    title: "Dog Tradicional",
    alt: "Hot Dog Tradicional",
  },
  {
    image: resolverUrlImagem("/uploads/produtos/quatro-dogs.jpeg")!,
    title: "Combo da Casa",
    alt: "Combo com quatro hot dogs",
  },
  {
    image: resolverUrlImagem("/uploads/produtos/bedida-soda.jpeg")!,
    title: "Soda Italiana",
    alt: "Soda Italiana Paraíba Refrescante",
  },
] as const;

export default function Inicio() {
  const [unidades, setUnidades] = useState<
    { href: string; cidade: string; endereco: string }[]
  >([]);
  const [showHomeSocials, setShowHomeSocials] = useState(true);

  useEffect(() => {
    listarUnidades()
      .then((unidadesApi) => {
        setUnidades(unidadesApi.map(mapearUnidade));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const alvoHash = window.location.hash.replace("#", "");
    if (!alvoHash) return;

    const rolarParaHash = () => {
      const alvo = document.getElementById(alvoHash);
      if (alvo) {
        alvo.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const rafId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(rolarParaHash);
    });

    return () => window.cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const footerSocialTargets = document.querySelectorAll("[data-footer-socials]");

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        setShowHomeSocials(!isVisible);
      },
      {
        threshold: 0.1,
      },
    );

    footerSocialTargets.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <BarraDeNavegacao />

      <main className="relative min-h-screen overflow-x-clip bg-preto-v1 pt-16">
        <div
          aria-hidden={!showHomeSocials}
          className={`pointer-events-none absolute inset-y-0 right-0 z-40 w-24 min-[768px]:w-28 transition-all duration-500 ease-out motion-reduce:transition-none ${
            showHomeSocials
              ? "translate-x-0 opacity-100 drop-shadow-[0_0_12px_rgba(255,255,255,0.14)]"
              : "translate-x-4 opacity-0 drop-shadow-none"
          }`}
        >
          <RedesSociais
            variant="home"
            className="pointer-events-auto sticky top-[calc(100svh-11rem)] ml-auto mr-4 flex-col gap-2.5 min-[490px]:top-[calc(100svh-11.5rem)] min-[490px]:gap-3 min-[490px]:mr-6 min-[768px]:mr-8"
          />
        </div>

        {/* HERO */}
        <section className="pagina-container pt-10 min-[490px]:pt-[clamp(2.5rem,1rem+4vw,6rem)]">
          <div className="relative flex w-full max-w-full min-w-0 flex-col items-center gap-6 text-center min-[490px]:grid min-[490px]:grid-cols-[auto_auto] min-[490px]:grid-rows-[auto_auto] min-[490px]:justify-center min-[490px]:gap-x-4 min-[490px]:gap-y-6 min-[768px]:gap-x-10 min-[1024px]:gap-x-16 min-[490px]:text-left">
            <h1 className="font-barlow-condensed text-[clamp(2.25rem,11vw,3rem)] font-black leading-[0.95] text-branco drop-shadow-[0_0_8px_rgba(45,45,45,0.35)] min-[490px]:col-start-1 min-[490px]:row-start-1 min-[490px]:text-[clamp(2.75rem,2.75rem+(100vw-30.625rem)*0.0405,8rem)]">
              <span className="min-[490px]:hidden">
                O DOG MAIS <span className="text-amarelo">ARRETADO</span>
                <br />
                DE BRASÍLIA
              </span>

              <span className="hidden min-[490px]:block">
                O DOG MAIS
                <br />
                <span className="text-amarelo">ARRETADO</span>
                <br />
                DE BRASÍLIA
              </span>
            </h1>

            <Botao
              variant="ifood"
              href={IFOOD_URL}
              external
              className="mt-3 min-[490px]:col-start-1 min-[490px]:row-start-2 min-[490px]:mt-0 min-[490px]:justify-self-start"
            >
              FAZER PEDIDO
            </Botao>

            <div className="relative min-[490px]:col-start-2 min-[490px]:row-start-1 min-[490px]:row-span-2 min-[490px]:justify-self-center min-[490px]:self-center">
              <img
                src={imgSmashHome}
                alt="Smash Home"
                className="animacao-smash-home h-auto w-[min(78vw,22rem)] max-w-none object-contain min-[490px]:w-[clamp(22rem,48vw,52rem)]"
              />
            </div>
          </div>
        </section>

        {/* NOSSOS HOT DOGS */}
        <section className="pagina-container flex flex-col items-center pt-24 pb-16 text-center min-[490px]:pt-36">
          <h2 className="font-barlow-condensed text-[clamp(2.25rem,10vw,3rem)] font-black uppercase text-branco min-[490px]:text-5xl">
            Nossos <span className="text-amarelo">Hot Dogs</span>
          </h2>

          <p className="mt-6 max-w-3xl px-3 font-barlow-condensed text-[clamp(0.95rem,3.6vw,1.875rem)] leading-snug text-branco min-[490px]:max-w-4xl min-[490px]:px-1 min-[490px]:text-2xl min-[490px]:leading-snug xl:whitespace-nowrap xl:text-3xl">
            Cada dog é uma experiência. Ingredientes premium com o tempero que só Paraíba tem!
          </p>

          <CarrosselNossosDogs cards={hotDogsCards} />

          <Botao
            href="/cardapio"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 font-semibold"
          >
            VER CARDÁPIO COMPLETO
          </Botao>
        </section>

        {/* ENCONTRE O MAIS PERTO */}
        <section
          id="unidades"
          className="scroll-mt-16 pagina-container flex flex-col items-center pt-12 pb-16 text-center min-[490px]:pt-16 min-[490px]:pb-20"
        >
          <h2 className="font-barlow-condensed text-[clamp(2.25rem,10vw,3rem)] font-black uppercase text-branco min-[490px]:text-[clamp(2.5rem,4vw,3.5rem)]">
            Encontre o <span className="text-amarelo">mais perto</span>
          </h2>

          <div className="mt-8 flex w-full max-w-3xl flex-col gap-4 min-[490px]:mt-12 min-[490px]:gap-5">
            {unidades.map(({ href, cidade, endereco }) => (
              <BotaoUnidade
                key={href}
                href={href}
                cidade={cidade}
                endereco={endereco}
              />
            ))}
          </div>
        </section>

        <DuvidasFrequentes />
      </main>

      <Rodape />
    </>
  );
}

function mapearUnidade(unidade: Unidade) {
  return {
    href: `/unidades/${criarSlugUnidade(unidade)}`,
    cidade: unidade.endereco.bairro.toUpperCase(),
    endereco: unidade.endereco.logradouro,
  };
}
