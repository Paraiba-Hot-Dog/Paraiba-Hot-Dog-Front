import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ImagePlus,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Save,
  Store,
  Trash2,
  X,
} from 'lucide-react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import {
  resolverUrlImagem,
  resolverUrlMapaEmbed,
  type Unidade,
} from '../../servicos/api'
import {
  atualizarUnidadeApi,
  criarUnidadeApi,
  excluirUnidadeApi,
  listarUnidadesApi,
} from '../../servicos/unidadesApi'

type UnidadeFormulario = {
  id: number | null
  nome: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  abertura: string
  fechamento: string
  descricao: string
  mapaUrl: string
  imagemUrl: string | null
  imagemArquivo: File | null
}

const unidadeVazia: UnidadeFormulario = {
  id: null,
  nome: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  abertura: '17:00',
  fechamento: '23:00',
  descricao: '',
  mapaUrl: '',
  imagemUrl: null,
  imagemArquivo: null,
}

export default function GestaoUnidades() {
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [formulario, setFormulario] = useState<UnidadeFormulario>(unidadeVazia)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState('')
  const [notificacao, setNotificacao] = useState<string | null>(null)
  const [unidadeParaExcluir, setUnidadeParaExcluir] = useState<Unidade | null>(null)
  const inputImagemRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let ativo = true

    listarUnidadesApi()
      .then((dados) => {
        if (!ativo) return
        setUnidades(dados)
        if (dados[0]) setFormulario(mapearUnidade(dados[0]))
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  const criando = formulario.id === null
  const enderecoCompleto = useMemo(
    () =>
      [
        formulario.logradouro,
        formulario.numero,
        formulario.complemento,
        formulario.bairro,
        formulario.cidade,
        formulario.estado,
        formulario.cep,
      ]
        .filter(Boolean)
        .join(', '),
    [formulario],
  )
  const mapaPreviewUrl = enderecoCompleto
    ? resolverUrlMapaEmbed(formulario.mapaUrl, enderecoCompleto)
    : ''
  const imagemPreview = useMemo(
    () =>
      formulario.imagemArquivo
        ? URL.createObjectURL(formulario.imagemArquivo)
        : formulario.imagemUrl,
    [formulario.imagemArquivo, formulario.imagemUrl],
  )

  useEffect(() => {
    return () => {
      if (formulario.imagemArquivo && imagemPreview) URL.revokeObjectURL(imagemPreview)
    }
  }, [formulario.imagemArquivo, imagemPreview])

  function selecionarUnidade(unidade: Unidade) {
    setFormulario(mapearUnidade(unidade))
    limparAvisos()
  }

  function iniciarCadastro() {
    setFormulario({ ...unidadeVazia })
    limparAvisos()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function atualizarCampo(campo: keyof UnidadeFormulario, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
    limparAvisos()
  }

  function escolherImagem(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!arquivo) return
    setFormulario((atual) => ({ ...atual, imagemArquivo: arquivo }))
    limparAvisos()
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    limparAvisos()

    if (criando && !formulario.imagemArquivo) {
      setErro('Escolha uma imagem para cadastrar a unidade.')
      return
    }

    setSalvando(true)
    try {
      if (criando && formulario.imagemArquivo) {
        const criada = await criarUnidadeApi({
          nome: formulario.nome.trim(),
          abertura: formulario.abertura,
          fechamento: formulario.fechamento,
          cep: somenteNumeros(formulario.cep),
          logradouro: formulario.logradouro.trim(),
          numero: valorOpcional(formulario.numero),
          complemento: valorOpcional(formulario.complemento),
          bairro: formulario.bairro.trim(),
          cidade: formulario.cidade.trim(),
          estado: formulario.estado.trim().toUpperCase(),
          descricao: valorOpcional(formulario.descricao),
          mapaUrl: valorOpcional(formulario.mapaUrl),
          imagem: formulario.imagemArquivo,
        })
        setUnidades((atuais) => [...atuais, criada])
        setFormulario(mapearUnidade(criada))
        setNotificacao('Unidade cadastrada com sucesso.')
      } else if (formulario.id !== null) {
        const atualizada = await atualizarUnidadeApi(formulario.id, {
          nome: formulario.nome.trim(),
          abertura: formulario.abertura,
          fechamento: formulario.fechamento,
          descricao: valorOpcional(formulario.descricao),
          mapaUrl: valorOpcional(formulario.mapaUrl),
          cep: somenteNumeros(formulario.cep),
          logradouro: formulario.logradouro.trim(),
          numero: valorOpcional(formulario.numero),
          complemento: valorOpcional(formulario.complemento),
          bairro: formulario.bairro.trim(),
          cidade: formulario.cidade.trim(),
          estado: formulario.estado.trim().toUpperCase(),
          imagem: formulario.imagemArquivo,
        })
        setUnidades((atuais) =>
          atuais.map((unidade) =>
            unidade.id === atualizada.id ? atualizada : unidade,
          ),
        )
        setFormulario(mapearUnidade(atualizada))
        setNotificacao('Unidade atualizada com sucesso.')
      }
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExclusao() {
    if (!unidadeParaExcluir) return
    setExcluindo(true)
    limparAvisos()

    try {
      await excluirUnidadeApi(unidadeParaExcluir.id)
      const restantes = await listarUnidadesApi()
      setUnidades(restantes)
      setFormulario(restantes[0] ? mapearUnidade(restantes[0]) : { ...unidadeVazia })
      setUnidadeParaExcluir(null)
      setNotificacao('Unidade excluída com sucesso.')
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setExcluindo(false)
    }
  }

  function limparAvisos() {
    setErro('')
  }

  return (
    <div className={`min-h-screen bg-[#edf2f8] text-preto-v1 ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin />

      <main className="mx-auto grid w-full max-w-[90rem] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[19rem_minmax(0,1fr)] lg:px-8 lg:py-8">
        <aside className="h-fit overflow-hidden rounded-2xl border border-[#d8dee7] bg-white shadow-sm lg:sticky lg:top-6">
          <div className="border-b border-[#e2e6ec] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amarelo/20">
                  <MapPin className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <h1 className="font-barlow-condensed text-2xl font-bold uppercase">
                    Gestão de unidades
                  </h1>
                  <p className="font-barlow text-sm text-cinza-base/70">
                    Cadastre e edite no mesmo lugar
                  </p>
                </div>
              </div>
              {notificacao && (
                <Notificacao mensagem={notificacao} onFechar={() => setNotificacao(null)} />
              )}
            </div>
            <button
              type="button"
              onClick={iniciarCadastro}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-preto-v1 px-4 py-3 font-barlow-condensed font-bold uppercase text-white transition hover:bg-cinza-botao"
            >
              <Plus className="h-5 w-5" aria-hidden /> Nova unidade
            </button>
          </div>

          <div className="p-3">
            <p className="px-2 pb-2 font-barlow text-xs font-semibold uppercase tracking-wider text-cinza-base/60">
              Unidades cadastradas ({unidades.length})
            </p>
            {carregando ? (
              <div className="flex items-center justify-center gap-2 py-8 font-barlow text-sm text-cinza-base/70">
                <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> Carregando...
              </div>
            ) : unidades.length === 0 ? (
              <p className="px-3 py-7 text-center font-barlow text-sm text-cinza-base/65">
                Nenhuma unidade cadastrada.
              </p>
            ) : (
              <div className="space-y-2">
                {unidades.map((unidade) => {
                  const selecionada = unidade.id === formulario.id
                  const imagem = resolverUrlImagem(unidade.imagem)
                  return (
                    <button
                      key={unidade.id}
                      type="button"
                      onClick={() => selecionarUnidade(unidade)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        selecionada
                          ? 'border-amarelo bg-amarelo/10'
                          : 'border-transparent hover:border-[#d8dee7] hover:bg-[#f7f9fc]'
                      }`}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#edf2f8]">
                        {imagem ? <img src={imagem} alt="" className="h-full w-full object-cover" /> : <Store className="h-5 w-5" aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate font-barlow text-sm">{unidade.nome}</strong>
                        <span className="block truncate font-barlow text-xs text-cinza-base/65">
                          {unidade.endereco.bairro} · {unidade.endereco.cidade}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        <form onSubmit={salvar} className="space-y-5">
          <section className="flex flex-col gap-4 rounded-2xl border border-[#d8dee7] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf2f8]">
                {criando ? <Plus aria-hidden /> : <Pencil aria-hidden />}
              </span>
              <div>
                <p className="font-barlow text-xs font-semibold uppercase tracking-wider text-cinza-base/60">
                  {criando ? 'Cadastro' : 'Edição'}
                </p>
                <h2 className="font-barlow-condensed text-2xl font-bold uppercase sm:text-3xl">
                  {criando ? 'Adicionar nova unidade' : formulario.nome}
                </h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!criando && (
                <button
                  type="button"
                  onClick={() => setUnidadeParaExcluir(unidades.find((item) => item.id === formulario.id) ?? null)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 font-barlow-condensed font-semibold uppercase text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden /> Excluir
                </button>
              )}
              {criando && unidades[0] && (
                <button
                  type="button"
                  onClick={() => selecionarUnidade(unidades[0])}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#cfd5de] px-4 py-2.5 font-barlow-condensed font-semibold uppercase transition hover:bg-[#f5f7fa]"
                >
                  <X className="h-4 w-4" aria-hidden /> Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={salvando || carregando}
                className="flex items-center justify-center gap-2 rounded-xl bg-preto-v1 px-5 py-2.5 font-barlow-condensed font-bold uppercase text-white transition hover:bg-cinza-botao disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                {criando ? 'Criar unidade' : 'Salvar alterações'}
              </button>
            </div>
          </section>

          {erro && <Aviso tipo="erro">{erro}</Aviso>}

          <SecaoFormulario icone={<Building2 aria-hidden />} titulo="Informações principais" descricao="Dados usados para identificar e exibir a unidade.">
            <div className="grid gap-4 md:grid-cols-2">
              <Campo label="Nome da unidade" value={formulario.nome} onChange={(valor) => atualizarCampo('nome', valor)} placeholder="Ex.: Unidade Águas Claras" required />
              <Campo label="Descrição" value={formulario.descricao} onChange={(valor) => atualizarCampo('descricao', valor)} placeholder="Nome exibido ao cliente" />
            </div>
          </SecaoFormulario>

          <SecaoFormulario icone={<MapPin aria-hidden />} titulo="Endereço e localização" descricao="Informe o endereço e cole o link exato da unidade no Google Maps.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <div className="lg:col-span-2"><Campo label="CEP" value={formulario.cep} onChange={(valor) => atualizarCampo('cep', valor)} placeholder="00000-000" maxLength={9} required /></div>
              <div className="lg:col-span-3"><Campo label="Logradouro" value={formulario.logradouro} onChange={(valor) => atualizarCampo('logradouro', valor)} placeholder="Avenida, rua ou praça" required /></div>
              <Campo label="Número" value={formulario.numero} onChange={(valor) => atualizarCampo('numero', valor)} placeholder="S/N" />
              <div className="lg:col-span-2"><Campo label="Bairro" value={formulario.bairro} onChange={(valor) => atualizarCampo('bairro', valor)} required /></div>
              <div className="lg:col-span-2"><Campo label="Cidade" value={formulario.cidade} onChange={(valor) => atualizarCampo('cidade', valor)} required /></div>
              <Campo label="Estado" value={formulario.estado} onChange={(valor) => atualizarCampo('estado', valor.toUpperCase())} maxLength={2} required />
              <Campo label="Complemento" value={formulario.complemento} onChange={(valor) => atualizarCampo('complemento', valor)} />
              <div className="sm:col-span-2 lg:col-span-6">
                <Campo label="Link do Google Maps" value={formulario.mapaUrl} onChange={(valor) => atualizarCampo('mapaUrl', valor)} placeholder="https://www.google.com/maps/place/..." />
              </div>
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-[#d8dee7] bg-[#f7f9fc]">
              {mapaPreviewUrl ? (
                <iframe title={`Mapa de ${formulario.nome || 'nova unidade'}`} src={mapaPreviewUrl} className="h-64 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              ) : (
                <div className="flex h-52 flex-col items-center justify-center px-5 text-center text-cinza-base/60">
                  <MapPin className="mb-2 h-8 w-8" aria-hidden />
                  <p className="font-barlow font-medium">Preencha o endereço para visualizar o mapa.</p>
                </div>
              )}
            </div>
            {enderecoCompleto && <p className="mt-3 font-barlow text-sm text-cinza-base/70"><strong>Endereço exibido:</strong> {enderecoCompleto}</p>}
          </SecaoFormulario>

          <div className="grid gap-5 xl:grid-cols-2">
            <SecaoFormulario icone={<Clock3 aria-hidden />} titulo="Horário de funcionamento" descricao="Defina o intervalo padrão de atendimento.">
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Abertura" type="time" value={formulario.abertura} onChange={(valor) => atualizarCampo('abertura', valor)} required />
                <Campo label="Fechamento" type="time" value={formulario.fechamento} onChange={(valor) => atualizarCampo('fechamento', valor)} required />
              </div>
            </SecaoFormulario>

            <SecaoFormulario icone={<Camera aria-hidden />} titulo="Foto da unidade" descricao={criando ? 'A imagem é obrigatória para cadastrar.' : 'Você pode manter ou substituir a imagem atual.'}>
              <input
                ref={inputImagemRef}
                id="unidade-foto-input"
                type="file"
                accept="image/*"
                onChange={escolherImagem}
                className="sr-only"
              />
              {imagemPreview ? (
                <div className="relative h-48 overflow-hidden rounded-xl bg-[#edf2f8]">
                  <img src={imagemPreview} alt="Prévia da unidade" className="h-full w-full object-cover" />
                  <label
                    htmlFor="unidade-foto-input"
                    className="absolute right-3 top-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-white shadow-md transition hover:bg-amarelo"
                    aria-label="Trocar imagem"
                  >
                    <Camera className="h-4 w-4" aria-hidden />
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="unidade-foto-input"
                  className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#cfd5de] bg-[#f7f9fc] font-barlow text-cinza-base/70 transition hover:border-amarelo hover:bg-amarelo/5"
                >
                  <ImagePlus className="mb-2 h-8 w-8" aria-hidden />
                  <strong>Adicionar foto</strong>
                  <span className="text-sm">PNG, JPG ou WEBP</span>
                </label>
              )}
              {!criando && formulario.imagemArquivo && (
                <p className="mt-3 font-barlow text-xs text-green-700">Nova imagem selecionada. Ela será enviada ao salvar.</p>
              )}
            </SecaoFormulario>
          </div>
        </form>
      </main>

      {unidadeParaExcluir && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-excluir-unidade"
          onClick={() => setUnidadeParaExcluir(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-branco px-8 py-10 text-center shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <p
              id="titulo-excluir-unidade"
              className="font-barlow text-lg font-bold text-preto-v1"
            >
              Tem certeza que deseja excluir esta unidade?
            </p>
            <p className="mt-2 font-barlow text-sm text-preto-v1">
              A unidade &quot;{unidadeParaExcluir.nome}&quot; será removida permanentemente.
            </p>

            <div className="mt-8 flex flex-col gap-2">
              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindo}
                className="w-full rounded-md bg-red-600 py-2 font-barlow text-base font-semibold text-branco transition-colors hover:bg-red-400 disabled:opacity-60"
              >
                {excluindo ? 'Excluindo...' : 'Sim, excluir unidade'}
              </button>
              <button
                type="button"
                onClick={() => setUnidadeParaExcluir(null)}
                disabled={excluindo}
                className="w-full rounded-md border border-gray-400 bg-gray-100 py-2 font-barlow text-base font-semibold text-preto-v1 transition-colors hover:bg-gray-200 disabled:opacity-60"
              >
                Não, manter unidade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Notificacao({
  mensagem,
  onFechar,
}: {
  mensagem: string
  onFechar: () => void
}) {
  useEffect(() => {
    const timer = window.setTimeout(onFechar, 2500)
    return () => window.clearTimeout(timer)
  }, [mensagem, onFechar])

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50 px-6 py-4 font-barlow text-sm font-medium text-emerald-800 shadow-[0_4px_16px_rgba(16,185,129,0.1)] sm:text-base"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 sm:h-6 sm:w-6" aria-hidden />
      <span className="whitespace-nowrap">{mensagem}</span>
    </div>
  )
}

function mapearUnidade(unidade: Unidade): UnidadeFormulario {
  return {
    id: unidade.id,
    nome: unidade.nome,
    cep: unidade.endereco.cep,
    logradouro: unidade.endereco.logradouro,
    numero: unidade.endereco.numero ?? '',
    complemento: unidade.endereco.complemento ?? '',
    bairro: unidade.endereco.bairro,
    cidade: unidade.endereco.cidade,
    estado: unidade.endereco.estado,
    abertura: unidade.abertura.slice(0, 5),
    fechamento: unidade.fechamento.slice(0, 5),
    descricao: unidade.descricao ?? '',
    mapaUrl: unidade.mapa_url ?? '',
    imagemUrl: resolverUrlImagem(unidade.imagem),
    imagemArquivo: null,
  }
}

function valorOpcional(valor: string) {
  return valor.trim() || null
}

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, '')
}

function mensagemErro(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.'
}

function Aviso({ tipo, children }: { tipo: 'erro' | 'sucesso'; children: ReactNode }) {
  return (
    <div className={`rounded-xl border px-4 py-3 font-barlow text-sm ${tipo === 'erro' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'}`}>
      {children}
    </div>
  )
}

function SecaoFormulario({ icone, titulo, descricao, children }: { icone: ReactNode; titulo: string; descricao: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#d8dee7] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3 border-b border-[#e6e9ee] pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amarelo/15 [&_svg]:h-5 [&_svg]:w-5">{icone}</span>
        <div><h3 className="font-barlow-condensed text-xl font-bold uppercase sm:text-2xl">{titulo}</h3><p className="font-barlow text-sm text-cinza-base/65">{descricao}</p></div>
      </div>
      {children}
    </section>
  )
}

type CampoProps = { label: string; value: string; onChange: (valor: string) => void; placeholder?: string; type?: string; required?: boolean; maxLength?: number }

function Campo({ label, value, onChange, placeholder, type = 'text', required, maxLength }: CampoProps) {
  return (
    <label className="block font-barlow text-sm font-semibold text-cinza-base">
      {label}{required && <span className="ml-1 text-red-600">*</span>}
      <input type={type} value={value} onChange={(evento) => onChange(evento.target.value)} placeholder={placeholder} required={required} maxLength={maxLength} className="mt-1.5 h-11 w-full rounded-lg border border-[#cfd5de] bg-white px-3 font-barlow font-normal text-preto-v1 outline-none transition placeholder:text-cinza-base/35 focus:border-preto-v1 focus:ring-2 focus:ring-amarelo/30" />
    </label>
  )
}
