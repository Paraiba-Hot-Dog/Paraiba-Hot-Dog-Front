type ModalConfirmacaoSaidaProps = {
  aberto: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export default function ModalConfirmacaoSaida({
  aberto,
  onConfirmar,
  onCancelar,
}: ModalConfirmacaoSaidaProps) {
  if (!aberto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-sair-titulo"
      onClick={onCancelar}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-branco px-8 py-10 text-center shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <p
          id="modal-sair-titulo"
          className="font-barlow text-lg font-bold text-preto-v1"
        >
          Tem certeza que deseja sair?
        </p>
        <p
          id="modal-sair-descricao"
          className="font-barlow text-sm text-preto-v1"
        >
          Você será redirecionado para a página inicial.
        </p>

        <div className="mt-8 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirmar}
            className="w-full rounded-md bg-red-600 py-2 font-barlow text-base font-semibold text-branco transition-colors hover:bg-red-400"
          >
            Sim, quero sair
          </button>

          <button
            type="button"
            onClick={onCancelar}
            className="w-full rounded-md border border-gray-400 bg-gray-100 py-2 font-barlow text-base font-semibold text-preto-v1 transition-colors hover:bg-gray-200"
          >
            Não, quero continuar
          </button>
        </div>
      </div>
    </div>
  )
}
