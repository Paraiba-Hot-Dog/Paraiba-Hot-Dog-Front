import type { EscopoAquisicao } from '../../../servicos/aquisicaoApi'
import { ROTULOS_ESCOPO } from './formatacaoAquisicao'

const CORES: Record<EscopoAquisicao, string> = {
  site: 'border-[#c7d3e2] bg-[#eef3f9] text-[#53657a]',
  unidade: 'border-[#9fd0ff] bg-[#e6f3ff] text-[#0b5fa8]',
  unidade_sobre_site: 'border-[#f2c66d] bg-[#fff6dd] text-[#7a5600]',
}

/** Selo que diz se um número é do site inteiro, só da unidade ou unidade ÷ site. */
export default function SeloEscopo({ escopo }: { escopo: EscopoAquisicao }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide max-[900px]:text-[11px] ${CORES[escopo]}`}
    >
      {ROTULOS_ESCOPO[escopo]}
    </span>
  )
}
