type BotaoUnidadeProps = {
  href: string
  cidade: string
  endereco: string
}

export default function BotaoUnidade({ href, cidade, endereco }: BotaoUnidadeProps) {
  return (
    <a
      href={href}
      className="block w-full max-w-full rounded-md border-1 border-branco bg-cinza-botao px-4 py-3 text-center font-barlow-condensed text-lg text-branco transition-opacity hover:opacity-90 active:opacity-80 min-[490px]:px-6 min-[490px]:text-[clamp(1.25rem,2.5vw,1.875rem)]"
    >
      <span className="font-semibold">{cidade}</span>
      <span className="font-normal"> - {endereco}</span>
    </a>
  )
}
