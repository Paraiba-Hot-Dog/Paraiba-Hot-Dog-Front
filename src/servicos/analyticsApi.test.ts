import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CHAVE_NAO_MEDIR,
  CHAVE_VISITA,
  VERSAO_COLETA,
  registrarEvento,
  registrarVisita,
} from './analyticsApi'

/**
 * Roda em ambiente `node`, com window, document, storages e fetch simulados.
 * A navegação do site é por recarga de página: cada "página" mantém o
 * sessionStorage da aba e perde os parâmetros da URL.
 */

class StorageFalso {
  private dados = new Map<string, string>()
  getItem(chave: string) {
    return this.dados.get(chave) ?? null
  }
  setItem(chave: string, valor: string) {
    this.dados.set(chave, String(valor))
  }
  removeItem(chave: string) {
    this.dados.delete(chave)
  }
  clear() {
    this.dados.clear()
  }
}

type Envio = { url: string; opcoes: RequestInit; corpo: Record<string, unknown> }

let enviados: Envio[]
let sessao: StorageFalso
let local: StorageFalso
let localizacao: { search: string; hostname: string; origin: string }
let documento: { referrer: string }

function novaAba({ search = '', referrer = '' } = {}) {
  sessao.clear()
  enviados.length = 0
  localizacao.search = search
  documento.referrer = referrer
}

function proximaPagina(search = '') {
  localizacao.search = search
  documento.referrer = 'https://site.test/'
}

function tipos() {
  return enviados.map((envio) => [envio.corpo.tipo, envio.corpo.primeiro_na_visita])
}

beforeEach(() => {
  enviados = []
  sessao = new StorageFalso()
  local = new StorageFalso()
  localizacao = { search: '', hostname: 'site.test', origin: 'https://site.test' }
  documento = { referrer: '' }

  vi.stubEnv('VITE_ANALYTICS_ATIVO', 'true')
  vi.stubGlobal('window', { location: localizacao })
  vi.stubGlobal('document', documento)
  vi.stubGlobal('sessionStorage', sessao)
  vi.stubGlobal('localStorage', local)
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, opcoes: RequestInit) => {
      enviados.push({ url, opcoes, corpo: JSON.parse(String(opcoes.body)) })
      return Promise.resolve(new Response(null, { status: 204 }))
    }),
  )
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('registrarEvento', () => {
  it('não envia nada com VITE_ANALYTICS_ATIVO desligada', () => {
    vi.stubEnv('VITE_ANALYTICS_ATIVO', 'false')

    registrarVisita()
    registrarEvento('clique_pedir')

    expect(enviados).toHaveLength(0)
  })

  it('marca primeiro_na_visita por etapa e envia a visita uma vez por aba', () => {
    novaAba({ search: '?utm_source=instagram&utm_medium=social&utm_campaign=bio' })

    registrarVisita()
    proximaPagina()
    registrarVisita()
    registrarEvento('abertura_cardapio')
    registrarEvento('visualizacao_produto', { produtoId: 7 })
    registrarEvento('visualizacao_produto', { produtoId: 8 })
    registrarEvento('clique_pedir')

    expect(tipos()).toEqual([
      ['visita_site', true],
      ['abertura_cardapio', true],
      ['visualizacao_produto', true],
      ['visualizacao_produto', false],
      ['clique_pedir', true],
    ])
    expect(enviados[3].corpo.produto_id).toBe(8)
  })

  it('usa as UTMs da primeira página em todos os eventos da visita', () => {
    novaAba({ search: '?utm_source=instagram&utm_medium=social&utm_campaign=bio' })
    registrarVisita()
    proximaPagina('?utm_source=qrcode')
    registrarEvento('abertura_cardapio')

    for (const envio of enviados) {
      expect(envio.corpo).toMatchObject({
        utm_source: 'instagram',
        utm_medium: 'social',
        utm_campaign: 'bio',
      })
    }
  })

  it('não lê UTM de páginas seguintes quando a primeira não tinha', () => {
    novaAba()
    registrarVisita()
    proximaPagina('?utm_source=qrcode')
    registrarEvento('abertura_cardapio')

    expect(enviados[1].corpo.utm_source).toBeNull()
  })

  it('envia a visita antes quando outro evento dispara primeiro', () => {
    novaAba({ search: '?utm_source=qrcode' })

    registrarEvento('abertura_cardapio')
    registrarVisita()

    expect(tipos()).toEqual([
      ['visita_site', true],
      ['abertura_cardapio', true],
    ])
    expect(enviados.every((envio) => envio.corpo.utm_source === 'qrcode')).toBe(true)
  })

  it.each([
    ['https://www.google.com.br/search?q=email%40exemplo.com', 'www.google.com.br'],
    ['https://l.instagram.com/?u=https%3A%2F%2Fsite.test&e=abc', 'l.instagram.com'],
    ['https://site.test/cardapio', null],
    ['android-app://com.google.android.gm/', null],
    ['', null],
  ])('envia só o domínio do referrer %s', (referrer, esperado) => {
    novaAba({ referrer })

    registrarVisita()

    expect(enviados[0].corpo.referrer_host).toBe(esperado)
    expect(enviados[0].opcoes.body).not.toContain('search')
  })

  it('não envia token nem dados de login', () => {
    local.setItem('token', 'segredo-do-login')
    local.setItem('access_token', 'segredo-do-login')
    novaAba()

    registrarVisita()
    registrarEvento('clique_pedir')

    for (const envio of enviados) {
      expect(envio.opcoes.headers).toBeUndefined()
      expect(envio.opcoes.credentials).toBe('omit')
      expect(envio.opcoes.keepalive).toBe(true)
      expect(String(envio.opcoes.body)).not.toContain('segredo')
      expect(envio.url).toMatch(/\/eventos$/)
      expect(envio.url).not.toContain('/analytics/')
      expect(Object.keys(envio.corpo).sort()).toEqual([
        'primeiro_na_visita',
        'produto_id',
        'referrer_host',
        'tipo',
        'unidade_id',
        'utm_campaign',
        'utm_medium',
        'utm_source',
        'versao_coleta',
      ])
      expect(envio.corpo.versao_coleta).toBe(VERSAO_COLETA)
    }
  })

  it('leva a unidade escolhida aos eventos seguintes, mas nunca à visita', () => {
    novaAba()

    registrarEvento('abertura_cardapio')
    registrarEvento('selecao_unidade', { unidadeId: 3 })
    registrarEvento('clique_pedir')
    registrarEvento('visualizacao_produto', { produtoId: 1, unidadeId: 5 })

    expect(enviados.map((envio) => envio.corpo.unidade_id)).toEqual([null, null, 3, 3, 5])
  })

  it('respeita o modo "não medir" até religar', () => {
    novaAba({ search: '?analytics=off' })
    registrarVisita()
    proximaPagina()
    registrarEvento('clique_pedir')
    expect(enviados).toHaveLength(0)
    expect(local.getItem(CHAVE_NAO_MEDIR)).toBe('1')

    novaAba()
    registrarVisita()
    expect(enviados).toHaveLength(0)

    novaAba({ search: '?analytics=on' })
    registrarVisita()
    expect(enviados).toHaveLength(1)
    expect(local.getItem(CHAVE_NAO_MEDIR)).toBeNull()
  })

  it('recomeça a visita quando o estado salvo está corrompido', () => {
    novaAba()
    sessao.setItem(CHAVE_VISITA, '{quebrado')

    registrarVisita()

    expect(tipos()).toEqual([['visita_site', true]])
  })

  it('não quebra a tela quando o fetch falha', () => {
    novaAba()
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede'))))
    expect(() => registrarVisita()).not.toThrow()

    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        throw new Error('síncrono')
      }),
    )
    expect(() => registrarEvento('clique_pedir')).not.toThrow()
  })

  it('não envia nada sem sessionStorage disponível', () => {
    novaAba()
    sessao.setItem = () => {
      throw new Error('cota')
    }

    registrarVisita()
    registrarEvento('clique_pedir')

    expect(enviados).toHaveLength(0)
  })
})
