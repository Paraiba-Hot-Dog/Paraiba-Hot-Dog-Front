import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import { listarUnidades, type Unidade } from '../../servicos/api'
import {
  atualizarUsuarioApi,
  criarUsuarioApi,
  excluirUsuarioApi,
  listarPermissoesApi,
  listarUsuariosApi,
  type FuncaoUsuarioApi,
  type NomePermissaoApi,
  type PermissaoApi,
  type UsuarioApi,
  type UsuarioCreateApi,
  type UsuarioUpdateApi,
} from '../../servicos/usuariosApi'

type PapelUsuario = 'Administrador' | 'Caixa' | 'Cozinha'

type UsuarioPainel = {
  id: number
  nome: string
  email: string
  funcao: FuncaoUsuarioApi
  papel: PapelUsuario
  unidadeId: number | null
  filial: string
  permissaoIds: number[]
  acessos: string[]
}

type DadosFormulario = {
  nome: string
  email: string
  senha: string
  funcao: FuncaoUsuarioApi
  unidadeId: number | null
  permissaoIds: number[]
}

const papelPorFuncao: Record<FuncaoUsuarioApi, PapelUsuario> = {
  administrador: 'Administrador',
  caixa: 'Caixa',
  cozinha: 'Cozinha',
}

const funcaoPorPapel: Record<PapelUsuario, FuncaoUsuarioApi> = {
  Administrador: 'administrador',
  Caixa: 'caixa',
  Cozinha: 'cozinha',
}

const permissaoLabels: Record<NomePermissaoApi, string> = {
  anotar_pedidos: 'Anotar Pedidos',
  cozinha: 'Cozinha',
  dashboard: 'Dashboard',
  configuracoes: 'Configurações',
}

const permissoesSugeridas: Record<PapelUsuario, NomePermissaoApi[]> = {
  Administrador: ['anotar_pedidos', 'cozinha', 'dashboard', 'configuracoes'],
  Caixa: ['anotar_pedidos'],
  Cozinha: ['cozinha'],
}

const papelClassName: Record<PapelUsuario, string> = {
  Administrador: 'bg-preto-v1 text-branco',
  Caixa: 'bg-[#48a958] text-white',
  Cozinha: 'bg-[#ff674f] text-white',
}

export default function GestaoUsuarios() {
  const [usuariosApi, setUsuariosApi] = useState<UsuarioApi[]>([])
  const [permissoes, setPermissoes] = useState<PermissaoApi[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<UsuarioPainel | null>(null)
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<UsuarioPainel | null>(
    null,
  )

  useEffect(() => {
    let ativo = true

    async function carregarDados() {
      try {
        const [usuarios, permissoesApi, unidadesApi] = await Promise.all([
          listarUsuariosApi(),
          listarPermissoesApi(),
          listarUnidades(),
        ])
        if (!ativo) return

        setUsuariosApi(usuarios)
        setPermissoes(permissoesApi)
        setUnidades(unidadesApi)
      } catch (error) {
        if (ativo) setErro(mensagemErro(error))
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarDados()
    return () => {
      ativo = false
    }
  }, [])

  const usuarios = useMemo(
    () => usuariosApi.map((usuario) => mapearUsuario(usuario, unidades)),
    [usuariosApi, unidades],
  )

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    if (!termo) return usuarios

    return usuarios.filter((usuario) =>
      `${usuario.nome} ${usuario.email} ${usuario.papel} ${usuario.filial}`
        .toLocaleLowerCase('pt-BR')
        .includes(termo),
    )
  }, [busca, usuarios])

  const administradores = usuarios.filter(
    (usuario) => usuario.papel === 'Administrador',
  ).length
  const usuariosComFilial = usuarios.filter((usuario) => usuario.unidadeId).length
  const filiais = new Set(
    usuarios.flatMap((usuario) => (usuario.unidadeId ? [usuario.unidadeId] : [])),
  ).size

  async function confirmarExclusao() {
    if (!usuarioParaExcluir) return

    setExcluindo(true)
    setErro('')
    try {
      await excluirUsuarioApi(usuarioParaExcluir.id)
      setUsuariosApi((atuais) =>
        atuais.filter((usuario) => usuario.id !== usuarioParaExcluir.id),
      )
      setUsuarioParaExcluir(null)
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setExcluindo(false)
    }
  }

  function abrirNovoUsuario() {
    setUsuarioEmEdicao(null)
    setModalAberto(true)
  }

  function abrirEdicao(usuario: UsuarioPainel) {
    setUsuarioEmEdicao(usuario)
    setModalAberto(true)
  }

  async function salvarUsuario(dados: DadosFormulario) {
    setSalvando(true)
    setErro('')

    try {
      if (usuarioEmEdicao) {
        const payload: UsuarioUpdateApi = {
          nome: dados.nome,
          email: dados.email,
          funcao: dados.funcao,
          unidade_id: dados.unidadeId,
          permissao_ids: dados.permissaoIds,
        }
        if (dados.senha) payload.senha = dados.senha

        const atualizado = await atualizarUsuarioApi(usuarioEmEdicao.id, payload)
        setUsuariosApi((atuais) =>
          atuais.map((usuario) =>
            usuario.id === atualizado.id ? atualizado : usuario,
          ),
        )
      } else {
        const payload: UsuarioCreateApi = {
          nome: dados.nome,
          email: dados.email,
          senha: dados.senha,
          funcao: dados.funcao,
          unidade_id: dados.unidadeId,
          permissao_ids: dados.permissaoIds,
        }
        const criado = await criarUsuarioApi(payload)
        setUsuariosApi((atuais) => [...atuais, criado])
      }

      setModalAberto(false)
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className={`min-h-screen bg-[#edf2f8] text-preto-v1 ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin />

      <main className="mx-auto w-full max-w-[82rem] px-4 py-7 sm:px-6 lg:px-8">
        {erro && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-barlow text-sm text-red-700">
            {erro}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-[#d8dee7] bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#e1e5eb] px-5 py-4 sm:px-6">
            <Users className="h-7 w-7" strokeWidth={1.8} aria-hidden />
            <div>
              <h1 className="font-barlow-condensed text-xl font-bold sm:text-2xl">
                Login e Permissões
              </h1>
              <p className="font-barlow text-xs text-cinza-base/70 sm:text-sm">
                Gerencie usuários e acessos
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-[#f7f9fc] p-4 md:grid-cols-4">
            <CardResumo rotulo="Usuários" valor={usuarios.length} />
            <CardResumo rotulo="Com filial" valor={usuariosComFilial} />
            <CardResumo rotulo="Administradores" valor={administradores} />
            <CardResumo rotulo="Filiais usadas" valor={filiais} />
          </div>

          <div className="flex flex-col gap-3 border-y border-[#e1e5eb] bg-[#f7f9fc] p-4 sm:flex-row">
            <label className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cinza-base/50"
                aria-hidden
              />
              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por nome ou email..."
                className="h-11 w-full rounded-lg border border-[#d7dce4] bg-white pl-10 pr-4 font-barlow text-sm outline-none transition focus:border-amarelo focus:ring-2 focus:ring-amarelo/25"
              />
            </label>

            <button
              type="button"
              onClick={abrirNovoUsuario}
              disabled={carregando}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-preto-v1 px-5 font-barlow-condensed font-semibold text-branco transition hover:bg-preto-v3 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Novo usuário
            </button>
          </div>

          {carregando ? (
            <p className="px-5 py-12 text-center font-barlow text-cinza-base/70">
              Carregando usuários...
            </p>
          ) : (
            <>
              <TabelaUsuarios
                usuarios={usuariosFiltrados}
                onEditar={abrirEdicao}
                onExcluir={setUsuarioParaExcluir}
              />
              <CardsUsuarios
                usuarios={usuariosFiltrados}
                onEditar={abrirEdicao}
                onExcluir={setUsuarioParaExcluir}
              />
              {usuariosFiltrados.length === 0 && (
                <p className="px-5 py-10 text-center font-barlow text-cinza-base/70">
                  Nenhum usuário encontrado.
                </p>
              )}
            </>
          )}
        </section>

        <section className="mt-5 rounded-xl border border-[#d8dee7] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-barlow-condensed text-xl font-bold">
            Permissões sugeridas por papel
          </h2>
          <p className="mt-1 font-barlow text-sm text-cinza-base/65">
            As permissões podem ser personalizadas individualmente para cada usuário.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {(Object.keys(permissoesSugeridas) as PapelUsuario[]).map((papel) => (
              <article key={papel} className="rounded-xl border border-[#dce1e8] p-4">
                <BadgePapel papel={papel} />
                <ul className="mt-3 space-y-1 font-barlow text-sm text-cinza-base/75">
                  {permissoesSugeridas[papel].map((permissao) => (
                    <li key={permissao}>• {permissaoLabels[permissao]}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>

      {modalAberto && (
        <ModalUsuario
          usuario={usuarioEmEdicao}
          permissoes={permissoes}
          unidades={unidades}
          salvando={salvando}
          onFechar={() => setModalAberto(false)}
          onSalvar={salvarUsuario}
        />
      )}

      <ModalConfirmacaoExclusao
        usuario={usuarioParaExcluir}
        excluindo={excluindo}
        onConfirmar={confirmarExclusao}
        onCancelar={() => setUsuarioParaExcluir(null)}
      />
    </div>
  )
}

function TabelaUsuarios({
  usuarios,
  onEditar,
  onExcluir,
}: AcoesUsuariosProps) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[58rem] border-collapse text-left font-barlow text-sm">
        <thead className="text-cinza-base/70">
          <tr className="border-b border-[#e1e5eb]">
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Papel</th>
            <th className="px-4 py-3 font-medium">Filial</th>
            <th className="px-4 py-3 font-medium">Acessos</th>
            <th className="px-4 py-3 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id} className="border-b border-[#e8ebf0] last:border-0">
              <td className="px-4 py-4 font-medium">{usuario.nome}</td>
              <td className="px-4 py-4 text-cinza-base/75">{usuario.email}</td>
              <td className="px-4 py-4"><BadgePapel papel={usuario.papel} /></td>
              <td className="px-4 py-4">{usuario.filial}</td>
              <td className="max-w-[24rem] px-4 py-4 text-xs text-cinza-base/70">
                {usuario.acessos.length ? usuario.acessos.join(' · ') : 'Sem acessos'}
              </td>
              <td className="px-4 py-4">
                <AcoesUsuario usuario={usuario} onEditar={onEditar} onExcluir={onExcluir} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type AcoesUsuariosProps = {
  usuarios: UsuarioPainel[]
  onEditar: (usuario: UsuarioPainel) => void
  onExcluir: (usuario: UsuarioPainel) => void
}

function CardsUsuarios({ usuarios, onEditar, onExcluir }: AcoesUsuariosProps) {
  return (
    <div className="grid gap-3 p-4 md:hidden">
      {usuarios.map((usuario) => (
        <article key={usuario.id} className="rounded-xl border border-[#dce1e8] bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-barlow font-semibold">{usuario.nome}</h2>
              <p className="mt-0.5 break-all font-barlow text-sm text-cinza-base/70">{usuario.email}</p>
            </div>
            <BadgePapel papel={usuario.papel} />
          </div>
          <dl className="mt-4 grid gap-3 font-barlow text-sm">
            <div><dt className="text-xs uppercase text-cinza-base/55">Filial</dt><dd className="mt-1">{usuario.filial}</dd></div>
            <div><dt className="text-xs uppercase text-cinza-base/55">Acessos</dt><dd className="mt-1 text-cinza-base/75">{usuario.acessos.length ? usuario.acessos.join(' · ') : 'Sem acessos'}</dd></div>
          </dl>
          <div className="mt-4 flex justify-end border-t border-[#eceff3] pt-3">
            <AcoesUsuario usuario={usuario} onEditar={onEditar} onExcluir={onExcluir} />
          </div>
        </article>
      ))}
    </div>
  )
}

function AcoesUsuario({
  usuario,
  onEditar,
  onExcluir,
}: Omit<AcoesUsuariosProps, 'usuarios'> & { usuario: UsuarioPainel }) {
  return (
    <div className="flex justify-end gap-1">
      <BotaoIcone rotulo={`Editar ${usuario.nome}`} onClick={() => onEditar(usuario)}>
        <Pencil className="h-4 w-4" />
      </BotaoIcone>
      <BotaoIcone rotulo={`Excluir ${usuario.nome}`} onClick={() => onExcluir(usuario)} perigo>
        <Trash2 className="h-4 w-4" />
      </BotaoIcone>
    </div>
  )
}

function ModalConfirmacaoExclusao({
  usuario,
  excluindo,
  onConfirmar,
  onCancelar,
}: {
  usuario: UsuarioPainel | null
  excluindo: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  if (!usuario) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="modal-excluir-usuario-titulo" onClick={onCancelar}>
      <div className="w-full max-w-sm rounded-lg bg-branco px-8 py-10 text-center shadow-lg" onClick={(event) => event.stopPropagation()}>
        <p id="modal-excluir-usuario-titulo" className="font-barlow text-lg font-bold text-preto-v1">Tem certeza que deseja excluir este usuário?</p>
        <p className="mt-2 font-barlow text-sm text-preto-v1">O usuário {usuario.nome} será removido permanentemente.</p>
        <div className="mt-8 flex flex-col gap-2">
          <button type="button" onClick={onConfirmar} disabled={excluindo} className="w-full rounded-md bg-red-600 py-2 font-barlow text-base font-semibold text-branco transition-colors hover:bg-red-400 disabled:opacity-60">{excluindo ? 'Excluindo...' : 'Sim, excluir usuário'}</button>
          <button type="button" onClick={onCancelar} disabled={excluindo} className="w-full rounded-md border border-gray-400 bg-gray-100 py-2 font-barlow text-base font-semibold text-preto-v1 transition-colors hover:bg-gray-200 disabled:opacity-60">Não, manter usuário</button>
        </div>
      </div>
    </div>
  )
}

function CardResumo({ rotulo, valor }: { rotulo: string; valor: number }) {
  return <article className="rounded-xl border border-[#d9dee6] bg-white p-4 shadow-sm"><p className="font-barlow text-xs text-cinza-base/65">{rotulo}</p><strong className="mt-1 block font-barlow-condensed text-3xl font-semibold">{valor}</strong></article>
}

function BadgePapel({ papel }: { papel: PapelUsuario }) {
  return <span className={`inline-flex rounded-full px-3 py-1 font-barlow text-xs font-semibold ${papelClassName[papel]}`}>{papel}</span>
}

function BotaoIcone({ children, rotulo, onClick, perigo = false }: { children: ReactNode; rotulo: string; onClick: () => void; perigo?: boolean }) {
  return <button type="button" onClick={onClick} aria-label={rotulo} className={`rounded-lg p-2 transition ${perigo ? 'text-red-500 hover:bg-red-50' : 'text-preto-v1 hover:bg-gray-100'}`}>{children}</button>
}

function ModalUsuario({
  usuario,
  permissoes,
  unidades,
  salvando,
  onFechar,
  onSalvar,
}: {
  usuario: UsuarioPainel | null
  permissoes: PermissaoApi[]
  unidades: Unidade[]
  salvando: boolean
  onFechar: () => void
  onSalvar: (dados: DadosFormulario) => void
}) {
  const [nome, setNome] = useState(usuario?.nome ?? '')
  const [email, setEmail] = useState(usuario?.email ?? '')
  const [senha, setSenha] = useState('')
  const [papel, setPapel] = useState<PapelUsuario>(usuario?.papel ?? 'Caixa')
  const [unidadeId, setUnidadeId] = useState<number | null>(usuario?.unidadeId ?? null)
  const [permissaoIds, setPermissaoIds] = useState<number[]>(
    usuario?.permissaoIds ?? idsPermissoesSugeridas('Caixa', permissoes),
  )

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSalvar({ nome, email, senha, funcao: funcaoPorPapel[papel], unidadeId, permissaoIds })
  }

  function trocarPapel(novoPapel: PapelUsuario) {
    setPapel(novoPapel)
    setPermissaoIds(idsPermissoesSugeridas(novoPapel, permissoes))
  }

  function alternarPermissao(permissaoId: number) {
    setPermissaoIds((atuais) => atuais.includes(permissaoId) ? atuais.filter((id) => id !== permissaoId) : [...atuais, permissaoId])
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-label={usuario ? 'Editar usuário' : 'Novo usuário'}>
      <form onSubmit={enviar} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-barlow-condensed text-2xl font-bold">{usuario ? 'Editar usuário' : 'Novo usuário'}</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="rounded-lg p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-6 grid gap-4">
          <CampoTexto rotulo="Nome" valor={nome} onChange={setNome} />
          <CampoTexto rotulo="Email" valor={email} onChange={setEmail} tipo="email" />
          <CampoTexto rotulo={usuario ? 'Nova senha (opcional)' : 'Senha'} valor={senha} onChange={setSenha} tipo="password" obrigatorio={!usuario} />
          <label className="grid gap-1.5 font-barlow text-sm font-semibold">Papel<select value={papel} onChange={(event) => trocarPapel(event.target.value as PapelUsuario)} className="h-11 rounded-lg border border-[#d7dce4] bg-white px-3 font-normal outline-none focus:border-amarelo focus:ring-2 focus:ring-amarelo/25"><option>Administrador</option><option>Caixa</option><option>Cozinha</option></select></label>
          <label className="grid gap-1.5 font-barlow text-sm font-semibold">Filial<select value={unidadeId ?? ''} onChange={(event) => setUnidadeId(event.target.value ? Number(event.target.value) : null)} className="h-11 rounded-lg border border-[#d7dce4] bg-white px-3 font-normal outline-none focus:border-amarelo focus:ring-2 focus:ring-amarelo/25"><option value="">Sem filial</option>{unidades.map((unidade) => <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>)}</select></label>
          <fieldset className="rounded-xl border border-[#d7dce4] p-4">
            <legend className="px-1 font-barlow text-sm font-semibold">Permissões de acesso</legend>
            <p className="mb-3 font-barlow text-xs text-cinza-base/60">Personalize os módulos que este usuário poderá acessar.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {permissoes.map((permissao) => <label key={permissao.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#e0e4ea] px-3 py-2.5 font-barlow text-sm transition hover:bg-gray-50"><input type="checkbox" checked={permissaoIds.includes(permissao.id)} onChange={() => alternarPermissao(permissao.id)} className="h-4 w-4 accent-black" />{permissaoLabels[permissao.nome]}</label>)}
            </div>
          </fieldset>
        </div>
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onFechar} disabled={salvando} className="rounded-lg border border-gray-300 px-5 py-2.5 font-barlow-condensed font-semibold disabled:opacity-60">Cancelar</button><button type="submit" disabled={salvando} className="rounded-lg bg-preto-v1 px-5 py-2.5 font-barlow-condensed font-semibold text-branco disabled:opacity-60">{salvando ? 'Salvando...' : 'Salvar'}</button></div>
      </form>
    </div>
  )
}

function CampoTexto({ rotulo, valor, onChange, tipo = 'text', obrigatorio = true }: { rotulo: string; valor: string; onChange: (valor: string) => void; tipo?: 'text' | 'email' | 'password'; obrigatorio?: boolean }) {
  return <label className="grid gap-1.5 font-barlow text-sm font-semibold">{rotulo}<input type={tipo} value={valor} onChange={(event) => onChange(event.target.value)} required={obrigatorio} className="h-11 rounded-lg border border-[#d7dce4] px-3 font-normal outline-none focus:border-amarelo focus:ring-2 focus:ring-amarelo/25" /></label>
}

function mapearUsuario(usuario: UsuarioApi, unidades: Unidade[]): UsuarioPainel {
  const unidade = unidades.find((item) => item.id === usuario.unidade_id)
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    funcao: usuario.funcao,
    papel: papelPorFuncao[usuario.funcao],
    unidadeId: usuario.unidade_id,
    filial: unidade?.nome ?? 'Sem filial',
    permissaoIds: usuario.permissoes.map((permissao) => permissao.id),
    acessos: usuario.permissoes.map((permissao) => permissaoLabels[permissao.nome]),
  }
}

function idsPermissoesSugeridas(papel: PapelUsuario, permissoes: PermissaoApi[]) {
  const nomes = new Set(permissoesSugeridas[papel])
  return permissoes.filter((permissao) => nomes.has(permissao.nome)).map((permissao) => permissao.id)
}

function mensagemErro(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.'
}
