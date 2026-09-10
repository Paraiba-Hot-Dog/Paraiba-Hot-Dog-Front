type CarrosselDogsProps = {
  image: string
  title: string
  alt: string
  destacado?: boolean
  modo?: 'destaque' | 'faixa'
}

export default function CarrosselDogs({
  image,
  title,
  alt,
  destacado = false,
  modo = 'destaque',
}: CarrosselDogsProps) {
  if (modo === 'faixa') {
    return (
      <article className="flex h-full w-full flex-col overflow-hidden rounded-md bg-[#2F2F2F] shadow-[0_0_20px_rgba(255,255,255,0.1),0_0_40px_rgba(255,255,255,0.07),0_0_70px_rgba(255,255,255,0.04)]">
        <img
          src={image}
          alt={alt}
          className="aspect-[4/5] w-full object-cover"
          loading="lazy"
        />
        <div className="px-2 py-2.5 min-[490px]:px-2 min-[490px]:py-2">
          <h3 className="truncate text-center font-barlow-condensed text-lg uppercase leading-tight text-white min-[490px]:text-[clamp(1rem,1.6vw,1.125rem)]">
            {title}
          </h3>
        </div>
      </article>
    )
  }

  return (
    <div
      className={[
        'shrink-0 overflow-hidden rounded-md bg-[#2F2F2F] transition-all duration-1000 ease-in-out',
        'shadow-[0_0_20px_rgba(255,255,255,0.1),0_0_40px_rgba(255,255,255,0.07),0_0_70px_rgba(255,255,255,0.04)]',
        destacado ? 'max-[489px]:opacity-100' : 'max-[489px]:opacity-40',
        destacado
          ? 'w-full max-w-[220px] min-[490px]:max-w-[260px] min-[490px]:w-[clamp(9rem,19.5vw,16rem)] max-[639px]:max-w-[220px] max-[639px]:w-[clamp(8.5rem,28vw,13.75rem)]'
          : 'w-full max-w-[188px] min-[490px]:max-w-[230px] min-[490px]:w-[clamp(7.5rem,16.5vw,13.75rem)] max-[639px]:max-w-[200px] max-[639px]:w-[clamp(7rem,24vw,12rem)]',
      ].join(' ')}
    >
      <img
        src={image}
        alt={alt}
        className={[
          'w-full object-cover',
          destacado
            ? 'h-[300px] min-[490px]:h-[clamp(14.75rem,30vw,23.25rem)] max-[639px]:h-[clamp(12.5rem,28vw,18rem)]'
            : 'h-[260px] min-[490px]:h-[clamp(12.5rem,26vw,20rem)] max-[639px]:h-[clamp(11rem,24vw,16rem)]',
        ].join(' ')}
      />

      <div className="px-1 py-2 min-[490px]:px-0">
        <h3
          className={[
            'font-barlow-condensed uppercase leading-tight text-white',
            destacado
              ? 'text-xl min-[490px]:text-[clamp(1.35rem,2vw,1.65rem)]'
              : 'text-lg min-[490px]:text-[clamp(1.15rem,1.65vw,1.5rem)]',
          ].join(' ')}
        >
          {title}
        </h3>
      </div>
    </div>
  )
}
