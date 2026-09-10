import { useEffect, useState, type ReactNode } from 'react'
import { Clock, ExternalLink, MapPin, Utensils } from 'lucide-react'
import BarraDeNavegacao from '../../componentes/usuario/BarraDeNavegacaoUsuario'
import Rodape from '../../componentes/usuario/Rodape'
import {
  criarSlugUnidade,
  listarUnidades,
  resolverUrlImagem,
  resolverUrlMapaEmbed,
  type Unidade,
} from '../../servicos/api'

const IFOOD_URL =
  'https://www.ifood.com.br/delivery/brasilia-df/paraiba-hot-dog-sul-aguas-claras/6b414c09-98ff-427f-9c06-1b00ad1438fe'

const MAPAS_POR_UNIDADE: Record<
  string,
  { mapsUrl: string; mapsEmbedUrl: string }
> = {
  'aguas-claras-jequitiba-praca-tangara': {
    mapsUrl:
      'https://www.google.com/maps/place/Para%C3%ADba+Hot+Dog+-+Avenida+Jequitib%C3%A1/@-15.8390999,-48.0391648,19z/data=!4m6!3m5!1s0x935a3380b07859e3:0xbd4277818efdfa8f!8m2!3d-15.8386522!4d-48.0392587!16s%2Fg%2F11fkch_sqm?entry=ttu&g_ep=EgoyMDI2MDYxMC4wIKXMDSoASAFQAw%3D%3D',
    mapsEmbedUrl:
      'https://www.google.com/maps?q=-15.8386522,-48.0392587&z=19&output=embed',
  },
}

function isAbertoAgora(abertura: string, fechamento: string) {
  const agora = new Date()
  const minutosAtuais = agora.getHours() * 60 + agora.getMinutes()
  const [horaAbertura, minutoAbertura] = abertura.split(':').map(Number)
  const [horaFechamento, minutoFechamento] = fechamento.split(':').map(Number)
  const abreEmMinutos = horaAbertura * 60 + minutoAbertura
  const fechaEmMinutos = horaFechamento * 60 + minutoFechamento

  return minutosAtuais >= abreEmMinutos && minutosAtuais < fechaEmMinutos
}

function BotaoLink({
  href,
  children,
  external = false,
}: {
  href: string
  children: ReactNode
  external?: boolean
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-branco px-5 py-2 font-barlow-condensed text-lg font-bold uppercase leading-none text-preto-v1 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.7),inset_0_-2px_6px_rgba(0,0,0,0.25)] transition-opacity hover:opacity-90 active:opacity-80"
    >
      {children}
    </a>
  )
}

type UnidadeAraucariasProps = {
  slug: string
}

// TODO: remover mock antes do commit — apenas para inspeção visual local
const unidadeMock: ReturnType<typeof mapearUnidade> = {
  nome: "Asa Norte",
  subtitulo: "Av. W3 Norte",
  imagem: null,
  abertura: "18:00",
  fechamento: "23:00",
  endereco: "Av. W3 Norte, 100, Asa Norte, Brasília - DF, 70000-000",
  referencia: "Próximo ao Conic",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Asa+Norte+Brasilia",
  mapsEmbedUrl: "https://www.google.com/maps?q=-15.7801,-47.9292&output=embed",
  ifoodUrl: IFOOD_URL,
  cardapioUrl: "/cardapio",
}

export default function UnidadeAraucarias({ slug }: UnidadeAraucariasProps) {
  // TODO: remover mock antes do commit — forçando estado inicial para inspeção visual
  const [unidade, setUnidade] = useState<ReturnType<typeof mapearUnidade> | null>(
    unidadeMock,
  )

  useEffect(() => {
    listarUnidades()
      .then((unidades) => {
        const unidadeApi = unidades.find(
          (item) => criarSlugUnidade(item) === slug,
        )

        if (!unidadeApi) {
          // TODO: remover mock — mantém mock se API falhar
          return
        }

        setUnidade(mapearUnidade(unidadeApi))
      })
      .catch(() => {
        // TODO: remover mock — mantém mock se API falhar
      })
  }, [slug])

  if (!unidade) {
    return (
      <>
        <BarraDeNavegacao />
        <main className="flex min-h-screen items-center justify-center bg-preto-v1 px-6 pt-16 text-center text-branco">
          <p className="font-barlow-condensed text-2xl font-bold uppercase">
            Carregando unidade...
          </p>
        </main>
        <Rodape />
      </>
    )
  }

  const aberto = isAbertoAgora(unidade.abertura, unidade.fechamento)

  return (
    <>
      <BarraDeNavegacao />

      <main className="min-h-screen overflow-x-hidden bg-preto-v1 pt-16 text-branco">
        <section className="pagina-container grid gap-8 pt-10 pb-20 min-[900px]:grid-cols-[minmax(0,31rem)_minmax(22rem,34rem)] min-[900px]:items-start min-[900px]:justify-center min-[900px]:gap-14 min-[900px]:pt-16">
          <div className="min-w-0 min-[900px]:pt-12">
            <p className="font-barlow-condensed text-2xl font-bold uppercase text-branco/80">
              Unidade
            </p>

            <h1 className="mt-2 flex flex-wrap items-center gap-x-2 font-barlow-condensed text-[clamp(1.6rem,5vw,2.5rem)] font-black uppercase leading-tight text-branco">
              <span>{unidade.nome}</span>
              <span className="text-branco/50">—</span>
              <span className="text-amarelo">{unidade.subtitulo}</span>
            </h1>

            <div className="mt-8 flex flex-col gap-5 font-barlow text-lg leading-snug min-[640px]:text-xl">
              <div className="flex items-start gap-3">
                <Clock className="mt-1 h-7 w-7 shrink-0 text-branco" aria-hidden />
                <div>
                  <p>
                    <span
                      className={
                        aberto
                          ? 'font-bold uppercase text-branco'
                          : 'font-bold uppercase text-red-400'
                      }
                    >
                      {aberto ? 'Aberto agora' : 'Fechado'}
                    </span>
                    <span className="text-branco/90">
                      , {unidade.abertura} às {unidade.fechamento}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-7 w-7 shrink-0 text-branco" aria-hidden />
                <div>
                  <a
                    href={unidade.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-amarelo"
                  >
                    {unidade.endereco}
                  </a>
                  {unidade.referencia && (
                    <p className="mt-1 text-base text-branco/70 min-[640px]:text-lg">
                      Localizado em: {unidade.referencia}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mx-auto mt-8 w-full max-w-[39.5rem] overflow-hidden rounded-md border border-branco/20 bg-cinza-botao min-[900px]:mx-0">
              <iframe
                title={`Mapa da unidade ${unidade.nome} ${unidade.subtitulo}`}
                src={unidade.mapsEmbedUrl}
                className="h-52 w-full border-0 min-[640px]:h-56"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="mx-auto mt-3 grid w-full max-w-[39.5rem] grid-cols-1 gap-3 min-[520px]:grid-cols-2 min-[900px]:mx-0">
              <BotaoLink href={unidade.ifoodUrl} external>
                <Utensils className="h-5 w-5" aria-hidden />
                Fazer pedido
              </BotaoLink>
              <BotaoLink href={unidade.cardapioUrl}>
                <ExternalLink className="h-5 w-5" aria-hidden />
                Acessar cardápio
              </BotaoLink>
            </div>
          </div>

          <aside className="min-w-0">
            <div className="mx-auto aspect-square w-full max-w-[18rem] overflow-hidden rounded-full border-4 border-branco/10 bg-cinza-botao min-[640px]:max-w-[23rem] min-[900px]:max-w-[26rem]">
              {unidade.imagem ? (
                <img
                  src={unidade.imagem}
                  alt={`Fachada da unidade Paraíba Hot Dog ${unidade.nome} ${unidade.subtitulo}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center font-barlow-condensed text-xl font-bold uppercase text-branco/60">
                  Imagem não cadastrada
                </div>
              )}
            </div>
          </aside>
        </section>
      </main>

      <Rodape />
    </>
  )
}

function mapearUnidade(unidade: Unidade) {
  const endereco = unidade.endereco
  const enderecoCompleto = [
    endereco.logradouro,
    endereco.numero,
    endereco.bairro,
    `${endereco.cidade} - ${endereco.estado}`,
    endereco.cep,
  ]
    .filter(Boolean)
    .join(', ')
  const localizacaoMapa = `Paraíba Hot Dog, ${enderecoCompleto}`
  const mapaCadastrado = MAPAS_POR_UNIDADE[criarSlugUnidade(unidade)]
  const mapsUrl =
    unidade.mapa_url ??
    mapaCadastrado?.mapsUrl ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(localizacaoMapa)}`
  const mapsEmbedUrl =
    unidade.mapa_url
      ? resolverUrlMapaEmbed(unidade.mapa_url, localizacaoMapa)
      : mapaCadastrado?.mapsEmbedUrl ??
        resolverUrlMapaEmbed(null, localizacaoMapa)

  return {
    nome: endereco.bairro,
    subtitulo: endereco.logradouro,
    imagem: resolverUrlImagem(unidade.imagem),
    abertura: unidade.abertura.slice(0, 5),
    fechamento: unidade.fechamento.slice(0, 5),
    endereco: enderecoCompleto,
    referencia:
      unidade.descricao?.replace(/^Localizado em:\s*/i, '').trim() || null,
    mapsUrl,
    mapsEmbedUrl,
    ifoodUrl: IFOOD_URL,
    cardapioUrl: '/cardapio',
  }
}
