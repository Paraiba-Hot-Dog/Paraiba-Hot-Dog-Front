import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { listarDuvidasApi, type DuvidaApi } from '../../../servicos/duvidasApi'

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
  const [duvidas, setDuvidas] = useState<DuvidaApi[]>([])
  const [openIds, setOpenIds] = useState<Set<number>>(() => new Set())

  useEffect(() => {
    let ativo = true

    listarDuvidasApi()
      .then((dados) => {
        if (ativo) setDuvidas(dados)
      })
      .catch(() => undefined)

    return () => {
      ativo = false
    }
  }, [])

  const toggleItem = (id: number) => {
    setOpenIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (duvidas.length === 0) {
    return null
  }

  return (
    <section className="pagina-container flex flex-col items-center pt-12 pb-24 text-center min-[490px]:pt-16 min-[490px]:pb-32">
      <h2 className="font-barlow-condensed text-[clamp(2.25rem,10vw,3rem)] font-black uppercase text-white min-[490px]:text-[clamp(2.5rem,4vw,3.5rem)]">
        Dúvidas <span className="text-amarelo">Frequentes</span>
      </h2>

      <div className="mt-6 flex w-full max-w-3xl flex-col gap-2 min-[490px]:mt-8 min-[490px]:gap-2.5">
        {duvidas.map(({ id, pergunta, resposta }) => (
          <FaqItem
            key={id}
            pergunta={pergunta}
            resposta={resposta}
            isOpen={openIds.has(id)}
            onToggle={() => toggleItem(id)}
          />
        ))}
      </div>
    </section>
  )
}
