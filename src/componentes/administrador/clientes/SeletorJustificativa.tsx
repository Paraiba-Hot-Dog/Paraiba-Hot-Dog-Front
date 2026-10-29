import { useCallback, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import type { MotivoAjustePontosApi } from '../../../servicos/clientesApi'
import { useFecharAoClicarFora } from '../dashboard/useFecharAoClicarFora'

type SeletorJustificativaProps = {
  motivos: MotivoAjustePontosApi[]
  selecionadoId: number | null
  onSelecionar: (id: number | null) => void
  disabled?: boolean
}

/** Ignora maiusculas e acentos na busca ("correcao" encontra "Correção"). */
function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Campo de selecao com busca: mostra uma justificativa por vez e lista as demais so quando aberto. */
export default function SeletorJustificativa({
  motivos,
  selecionadoId,
  onSelecionar,
  disabled,
}: SeletorJustificativaProps) {
  const [aberto, setAberto] = useState(false)
  const [termo, setTermo] = useState('')
  const [destaque, setDestaque] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listaId = useId()

  const selecionado = motivos.find((motivo) => motivo.id === selecionadoId) ?? null
  const termoNormalizado = normalizar(termo.trim())
  const filtrados = termoNormalizado
    ? motivos.filter((motivo) => normalizar(motivo.descricao).includes(termoNormalizado))
    : motivos

  const fechar = useCallback(() => {
    setAberto(false)
    setTermo('')
  }, [])

  useFecharAoClicarFora(aberto, containerRef, fechar)

  function abrir() {
    if (disabled) return
    setAberto(true)
    setTermo('')
    setDestaque(Math.max(0, motivos.findIndex((motivo) => motivo.id === selecionadoId)))
  }

  function selecionar(motivo: MotivoAjustePontosApi) {
    onSelecionar(motivo.id)
    fechar()
  }

  function limpar() {
    onSelecionar(null)
    inputRef.current?.focus()
  }

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault()
      if (!aberto) {
        abrir()
        return
      }
      const passo = evento.key === 'ArrowDown' ? 1 : -1
      setDestaque((atual) => Math.min(Math.max(atual + passo, 0), Math.max(filtrados.length - 1, 0)))
    } else if (evento.key === 'Enter') {
      // Impede que o Enter envie o formulario do modal enquanto a lista esta aberta.
      if (!aberto) return
      evento.preventDefault()
      const motivo = filtrados[destaque]
      if (motivo) selecionar(motivo)
    } else if (evento.key === 'Escape' && aberto) {
      evento.stopPropagation()
      fechar()
    }
  }

  return (
    <div ref={containerRef} className="grid gap-1">
      <div
        className={`flex h-11 items-center gap-2 rounded-xl border bg-white px-3 transition ${
          aberto ? 'border-amarelo' : 'border-[#d8dee8]'
        } ${disabled ? 'opacity-60' : ''}`}
      >
        <Search size={16} className="shrink-0 text-cinza-base" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Justificativa da alteração"
          aria-expanded={aberto}
          aria-controls={listaId}
          aria-autocomplete="list"
          aria-activedescendant={aberto && filtrados[destaque] ? `${listaId}-${filtrados[destaque].id}` : undefined}
          value={aberto ? termo : selecionado?.descricao ?? ''}
          onChange={(evento) => {
            setTermo(evento.target.value)
            setDestaque(0)
            if (!aberto) setAberto(true)
          }}
          onFocus={abrir}
          onClick={() => !aberto && abrir()}
          onKeyDown={aoTeclar}
          disabled={disabled}
          placeholder={aberto && selecionado ? selecionado.descricao : 'Buscar ou selecionar justificativa'}
          className="min-w-0 flex-1 bg-transparent font-barlow text-sm text-preto-v1 outline-none placeholder:text-cinza-base/70"
        />
        {selecionado && !aberto ? (
          <button
            type="button"
            onClick={limpar}
            disabled={disabled}
            aria-label="Limpar justificativa"
            className="shrink-0 text-cinza-base transition hover:text-preto-v1"
          >
            <X size={16} />
          </button>
        ) : (
          <ChevronDown
            size={16}
            className={`shrink-0 text-cinza-base transition ${aberto ? 'rotate-180' : ''}`}
            aria-hidden
          />
        )}
      </div>

      {/* A lista fica no fluxo (nao absoluta) para nao ser cortada pela rolagem do modal. */}
      {aberto && (
        <ul
          id={listaId}
          role="listbox"
          aria-label="Justificativas"
          className="max-h-52 overflow-y-auto rounded-xl border border-[#d8dee8] bg-white py-1 shadow-sm"
        >
          {filtrados.length === 0 ? (
            <li className="px-3 py-2 font-barlow text-sm text-cinza-base">
              Nenhuma justificativa encontrada para &quot;{termo.trim()}&quot;.
            </li>
          ) : (
            filtrados.map((motivo, indice) => {
              const ativo = motivo.id === selecionadoId
              return (
                <li
                  key={motivo.id}
                  id={`${listaId}-${motivo.id}`}
                  role="option"
                  aria-selected={ativo}
                  // mousedown + preventDefault mantem o foco no campo e evita fechar antes do clique.
                  onMouseDown={(evento) => {
                    evento.preventDefault()
                    selecionar(motivo)
                  }}
                  onMouseEnter={() => setDestaque(indice)}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-2 font-barlow text-sm text-preto-v1 ${
                    indice === destaque ? 'bg-amarelo/10' : ''
                  }`}
                >
                  <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{motivo.descricao}</span>
                  {motivo.exige_observacao && (
                    <span className="shrink-0 rounded-full bg-amarelo/20 px-2 py-0.5 text-[9px] font-black uppercase">
                      Exige observação
                    </span>
                  )}
                  {ativo && <Check size={14} className="shrink-0" aria-hidden />}
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
