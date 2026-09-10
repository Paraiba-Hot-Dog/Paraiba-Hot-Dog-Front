import CarrosselDogs from './CarrosselDogs'

export type HotDogCard = {
  image: string
  title: string
  alt: string
}

type CarrosselNossosDogsProps = {
  cards: readonly HotDogCard[]
}

export default function CarrosselNossosDogs({ cards }: CarrosselNossosDogsProps) {
  if (!cards.length) return null

  const faixaCards = [...cards, ...cards]
  const deslocamento = `-${(cards.length / faixaCards.length) * 100}%`

  return (
    <div
      className="mt-16 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Nossos hot dogs"
    >
      <div
        className="carrossel-nossos-dogs-faixa flex animacao-carrossel-dogs-grupos motion-reduce:animate-none hover:[animation-play-state:paused]"
        style={{
          ['--carrossel-total' as string]: faixaCards.length,
          ['--carrossel-shift' as string]: deslocamento,
        }}
      >
        {faixaCards.map((card, index) => (
          <div
            key={`${card.title}-${index}`}
            className="carrossel-nossos-dogs-card shrink-0 px-1 min-[490px]:px-1.5"
          >
            <CarrosselDogs
              image={card.image}
              title={card.title}
              alt={card.alt}
              modo="faixa"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
