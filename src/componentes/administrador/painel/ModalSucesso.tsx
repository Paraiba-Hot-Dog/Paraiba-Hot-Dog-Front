import { CheckCircle2 } from 'lucide-react'

type ModalSucessoProps = {
  aberto: boolean
  onFechar: () => void
}

export default function ModalSucesso({ aberto, onFechar }: ModalSucessoProps) {
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
          O texto de “Sobre Nós” foi atualizado com sucesso.
        </p>
        <button
          type="button"
          onClick={onFechar}
          className="mt-7 w-full rounded-xl bg-emerald-600 py-3 font-barlow-condensed text-lg font-black uppercase text-white transition hover:bg-emerald-700"
        >
          OK
        </button>
      </div>
    </div>
  )
}
