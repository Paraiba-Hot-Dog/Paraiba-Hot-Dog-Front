import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqItems = [
  {
    pergunta: 'Quais são os horários de funcionamento?',
    resposta: 'Funcionamos todos os dias, das 17:00 às 23:00',
  },
  {
    pergunta: 'Vocês fazem delivery?',
    resposta: 'Sim, fazemos delivery pelo iFood',
  },
  {
    pergunta: 'Tem opções vegetarianas?',
    resposta:
      'Sim, contamos com opções vegetarianas deliciosas no nosso cardápio!',
  },
  {
    pergunta: 'Posso personalizar meu hot dog?',
    resposta:
      'Sim, você pode personalizar seu hot dog escolhendo os ingredientes que preferir.',
  },
  {
    pergunta: 'Vocês aceitam cartão?',
    resposta: 'Sim, aceitamos débito e crédito.',
  },
] as const

type FaqItemProps = {
  pergunta: string
  resposta: string
  isOpen: boolean
  onToggle: () => void
}

function FaqItem({ pergunta, resposta, isOpen, onToggle }: FaqItemProps) {
  return (
    <div className="overflow-hidden border border-preto-v3 bg-preto-v2">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left min-[490px]:px-6 min-[490px]:py-5"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="font-barlow-condensed text-lg font-semibold uppercase text-branco min-[490px]:text-xl">
          {pergunta}
        </span>
        <ChevronDown
          aria-hidden
          className={`h-5 w-5 shrink-0 text-amarelo transition-transform duration-300 min-[490px]:h-6 min-[490px]:w-6 ${
            isOpen ? 'rotate-180' : ''
          }`}
          strokeWidth={2.5}
        />
      </button>

      {isOpen && (
        <div className="px-5 pb-4 pt-0 min-[490px]:px-6 min-[490px]:pb-5">
          <p className="text-left font-barlow text-base font-normal text-branco min-[490px]:text-lg">
            {resposta}
          </p>
        </div>
      )}
    </div>
  )
}

export default function DuvidasFrequentes() {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(() => new Set())

  const toggleItem = (index: number) => {
    setOpenIndexes((current) => {
      const next = new Set(current)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <section className="pagina-container flex flex-col items-center pt-12 pb-24 text-center min-[490px]:pt-16 min-[490px]:pb-32">
      <h2 className="font-barlow-condensed text-[clamp(2.25rem,10vw,3rem)] font-black uppercase text-white min-[490px]:text-[clamp(2.5rem,4vw,3.5rem)]">
        Dúvidas <span className="text-amarelo">Frequentes</span>
      </h2>

      <div className="mt-6 flex w-full max-w-3xl flex-col gap-2 min-[490px]:mt-8 min-[490px]:gap-2.5">
        {faqItems.map(({ pergunta, resposta }, index) => (
          <FaqItem
            key={pergunta}
            pergunta={pergunta}
            resposta={resposta}
            isOpen={openIndexes.has(index)}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </div>
    </section>
  )
}
