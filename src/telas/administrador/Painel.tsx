import { useEffect, useState } from 'react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import ModalConfirmacaoSaida from '../../componentes/administrador/painel/ModalConfirmacaoSaida'
import OpcoesPainel from '../../componentes/administrador/painel/OpcoesPainel'
import SeletorUnidade from '../../componentes/administrador/painel/SeletorUnidade'
import { listarUnidades } from '../../servicos/api'
import { useAuth } from '../../contextos/useAuth'

export default function Painel() {
  const [unidades, setUnidades] = useState<string[]>([])
  const [unidadeSelecionada, setUnidadeSelecionada] = useState('')
  const [carregandoUnidades, setCarregandoUnidades] = useState(true)
  const [erroUnidades, setErroUnidades] = useState(false)
  const [modalSairAberto, setModalSairAberto] = useState(false)
  const { usuarioAtual, isLoadingUser } = useAuth()
  const unidadeUsuarioId = usuarioAtual?.unidade_id ?? null

  useEffect(() => {
    if (isLoadingUser) {
      setCarregandoUnidades(true)
      return
    }

    let ativo = true

    listarUnidades()
      .then((unidadesApi) => {
        if (!ativo) return

        const unidadesPermitidas = unidadeUsuarioId
          ? unidadesApi.filter((unidade) => unidade.id === unidadeUsuarioId)
          : unidadesApi
        const nomes = unidadesPermitidas.map((unidade) => unidade.nome)
        setUnidades(nomes)
        setUnidadeSelecionada(nomes[0] ?? '')
      })
      .catch(() => {
        if (ativo) setErroUnidades(true)
      })
      .finally(() => {
        if (ativo) setCarregandoUnidades(false)
      })

    return () => {
      ativo = false
    }
  }, [isLoadingUser, unidadeUsuarioId])

  function abrirModalSair() {
    setModalSairAberto(true)
  }

  function fecharModalSair() {
    setModalSairAberto(false)
  }

  function confirmarSaida() {
    setModalSairAberto(false)
    window.location.href = '/login'
  }

  return (
    <div className={`flex min-h-screen flex-col bg-branco ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin />

      <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-14">
        <div className="flex w-full max-w-2xl flex-1 flex-col items-center">
          <h1 className="text-center font-barlow-condensed text-3xl font-semibold text-preto-v1 sm:text-5xl">
            Bem-vindo(a) ao painel administrativo!
          </h1>

          <div className="mt-8 w-full">
            {carregandoUnidades && (
              <p className="text-center font-barlow text-cinza-base">
                Carregando unidades...
              </p>
            )}

            {!carregandoUnidades && erroUnidades && (
              <p className="text-center font-barlow text-red-600">
                Não foi possível carregar as unidades.
              </p>
            )}

            {!carregandoUnidades && !erroUnidades && unidades.length === 0 && (
              <p className="text-center font-barlow text-cinza-base">
                Nenhuma unidade cadastrada.
              </p>
            )}

            {!carregandoUnidades && !erroUnidades && unidades.length > 0 && (
              <SeletorUnidade
                opcoes={unidades}
                valor={unidadeSelecionada}
                onChange={setUnidadeSelecionada}
                disabled={Boolean(unidadeUsuarioId)}
              />
            )}
          </div>

          <OpcoesPainel />
        </div>
      </main>

    <footer className="shrink-0 px-4 pb-8">
        <div className="mx-auto w-full max-w-2xl">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-cinza-base/60 to-transparent" />

            <div className="pt-6">
            <button
                type="button"
                onClick={abrirModalSair}
                className="mx-auto flex items-center gap-1 font-barlow text-sm text-cinza-base transition-colors hover:text-preto-v1"
            >
                <span aria-hidden>←</span>
                Sair
            </button>
            </div>
        </div>
    </footer>
      <ModalConfirmacaoSaida
        aberto={modalSairAberto}
        onConfirmar={confirmarSaida}
        onCancelar={fecharModalSair}
      />
    </div>
  )
}
