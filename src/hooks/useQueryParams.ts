import { useMemo, useSyncExternalStore } from 'react'

/**
 * Estado guardado na query string da pagina, sem roteador.
 * Reage ao botao de voltar (popstate) e a atualizacoes feitas por este hook.
 */

const EVENTO_URL = 'paraiba:urlchange'

function assinar(callback: () => void) {
  window.addEventListener('popstate', callback)
  window.addEventListener(EVENTO_URL, callback)
  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener(EVENTO_URL, callback)
  }
}

function lerSearch() {
  return window.location.search
}

export type MudancasQuery = Record<string, string | number | null | undefined>

/**
 * Atualiza a query string. `null`, `undefined` ou '' removem o parametro.
 * `historico: 'push'` cria uma entrada nova (o voltar do navegador desfaz);
 * `'replace'` substitui a atual.
 */
export function atualizarQuery(
  mudancas: MudancasQuery,
  historico: 'push' | 'replace' = 'replace',
) {
  const url = new URL(window.location.href)
  Object.entries(mudancas).forEach(([chave, valor]) => {
    if (valor === null || valor === undefined || valor === '') {
      url.searchParams.delete(chave)
    } else {
      url.searchParams.set(chave, String(valor))
    }
  })

  if (url.search === window.location.search) return

  const metodo = historico === 'push' ? 'pushState' : 'replaceState'
  window.history[metodo](window.history.state, '', url)
  window.dispatchEvent(new Event(EVENTO_URL))
}

export function useQueryParams() {
  const search = useSyncExternalStore(assinar, lerSearch)
  const params = useMemo(() => new URLSearchParams(search), [search])

  // atualizarQuery e uma funcao de modulo, entao a referencia ja e estavel.
  return [params, atualizarQuery] as const
}
