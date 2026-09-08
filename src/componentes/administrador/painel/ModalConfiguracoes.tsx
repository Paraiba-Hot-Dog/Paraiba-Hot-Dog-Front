import { X } from 'lucide-react'
import EdicaoBlog from './EdicaoBlog'
import EdicaoCardapio from './EdicaoCardapio'
import EdicaoUnidades from './EdicaoUnidades'
import GestaoUsuarios from './GestaoUsuarios'
import GestaoClientes from './GestaoClientes'

type ModalConfiguracoesProps = {
  aberto: boolean
  onFechar: () => void
}

export default function ModalConfiguracoes({
  aberto,
  onFechar,
}: ModalConfiguracoesProps) {
  if (!aberto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-configuracoes-titulo"
      onClick={onFechar}
    >
      <div
        className="relative w-full max-w-sm rounded-lg bg-branco p-4 pt-8 shadow-md sm:max-w-lg sm:p-6 sm:pt-10"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onFechar}
          className="absolute top-2 right-3 text-cinza-base transition-colors hover:text-preto-v1 sm:top-3 sm:right-4"
          aria-label="Fechar configurações"
        >
          <X className="size-5 sm:size-6" strokeWidth={2} />
        </button>

        <h2
          id="modal-configuracoes-titulo"
          className="mb-3 px-6 text-center font-barlow-condensed text-lg font-base text-preto-v1 sm:mb-5 sm:px-0 sm:text-2xl"
        >
          Selecione a configuração:
        </h2>

        <div className="flex flex-col gap-3 sm:gap-4">
          <EdicaoUnidades onNavigate={onFechar} />
          <EdicaoCardapio onNavigate={onFechar} />
          <EdicaoBlog onNavigate={onFechar} />
          <GestaoUsuarios onNavigate={onFechar} />
          <GestaoClientes onNavigate={onFechar} />
        </div>
      </div>
    </div>
  )
}
