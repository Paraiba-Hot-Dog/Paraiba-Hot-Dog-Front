import { useEffect, useState, type FormEvent } from 'react'
import { Info, Save } from 'lucide-react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import ModalSucesso from '../../componentes/administrador/painel/ModalSucesso'
import {
  atualizarSobreNosApi,
  obterSobreNosApi,
  TEXTO_PADRAO_SOBRE_NOS,
} from '../../servicos/institucionalApi'

export default function EdicaoSobreNos() {
  const [texto, setTexto] = useState(TEXTO_PADRAO_SOBRE_NOS)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mostrarModalSucesso, setMostrarModalSucesso] = useState(false)

  useEffect(() => {
    let ativo = true
    obterSobreNosApi()
      .then((conteudo) => {
        if (ativo) setTexto(conteudo.texto)
      })
      .catch((error: Error) => {
        if (ativo) setErro(error.message)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const textoAtualizado = texto.trim()
    if (!textoAtualizado) {
      setErro('Preencha o texto de Sobre Nós.')
      return
    }

    setErro('')
    setSalvando(true)
    try {
      const conteudo = await atualizarSobreNosApi(textoAtualizado)
      setTexto(conteudo.texto)
      setMostrarModalSucesso(true)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar o texto.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className={`min-h-screen bg-[#f4f6fb] text-preto-v1 ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-[#d8dee7] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amarelo/15">
              <Info size={22} strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h1 className="font-barlow-condensed text-2xl font-bold uppercase sm:text-3xl">
                Edição de Sobre Nós
              </h1>
              <p className="font-barlow text-cinza-base/70">
                Atualize o texto exibido na página pública.
              </p>
            </div>
          </div>

          {carregando ? (
            <p className="mt-8 font-barlow text-cinza-base">Carregando conteúdo...</p>
          ) : (
            <form className="mt-8 grid gap-4" onSubmit={salvar}>
              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
                  Texto
                </span>
                <textarea
                  value={texto}
                  onChange={(evento) => {
                    setTexto(evento.target.value)
                    setErro('')
                  }}
                  rows={8}
                  className="w-full resize-y rounded-xl border border-[#d8dee8] bg-white p-3 font-barlow leading-6 outline-none focus:border-amarelo"
                  aria-label="Texto de Sobre Nós"
                />
              </label>
              {erro && <p className="font-barlow text-red-600">{erro}</p>}
              <button
                type="submit"
                disabled={salvando}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-amarelo px-5 py-3 font-barlow-condensed font-black uppercase text-preto-v1 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={18} />
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </form>
          )}
        </section>
      </main>
      <ModalSucesso
        aberto={mostrarModalSucesso}
        onFechar={() => setMostrarModalSucesso(false)}
      />
    </div>
  )
}
