import { CheckCircle2, ExternalLink } from 'lucide-react'

type ModalSucessoProps = {
  aberto: boolean
  onFechar: () => void
  mensagem?: string
}

const classeFonteBotaoPopup =
  'inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-barlow text-xs font-semibold uppercase leading-none'

export default function ModalSucesso({
  aberto,
  onFechar,
  mensagem = 'O conteúdo de “Sobre Nós” foi atualizado com sucesso.',
}: ModalSucessoProps) {
  if (!aberto) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-sucesso-titulo"
    >
      <div className="w-full max-w-sm rounded-2xl bg-branco px-8 py-8 text-center shadow-xl">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" aria-hidden />
        <h2
          id="modal-sucesso-titulo"
          className="mt-4 font-barlow-condensed text-3xl font-black text-preto-v1"
        >
          Alterações salvas!
        </h2>
        <p className="mt-2 font-barlow text-base text-cinza-base">
          {mensagem}
        </p>
        <div className="mt-7 grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => window.open('/sobre-nos', '_blank', 'noopener,noreferrer')}
            className={`${classeFonteBotaoPopup} bg-amarelo text-preto-v1 transition hover:brightness-95`}
          >
            <ExternalLink size={14} />
            Ver página Sobre Nós
          </button>
          <button
            type="button"
            onClick={onFechar}
            className={`${classeFonteBotaoPopup} bg-emerald-600 text-white transition hover:bg-emerald-700`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
