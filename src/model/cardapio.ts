export type TipoVariacao = 'normal' | 'combo'

export type CategoriaRead = {
  id: number
  nome: string
}

export type SubcategoriaRead = {
  id: number
  nome: string
  categoria_id: number
}

export type ProdutoVariacaoRead = {
  id: number
  produto_id: number
  nome: string
  tipo: TipoVariacao
  preco: string | number
  ativo: boolean
}

export type ProdutoAdicionalRead = {
  id: number
  produto_id: number
  nome: string
  preco: string | number
}

export type ProdutoRead = {
  id: number
  nome: string
  descricao?: string | null
  imagem_url?: string | null
  ativo: boolean
  pontos_fidelidade_por_unidade: number
  disponivel_todas_unidades: boolean
  subcategoria_id: number
  unidade_ids: number[]
  variacoes: ProdutoVariacaoRead[]
  adicionais: ProdutoAdicionalRead[]
}

export type UnidadeRead = {
  id: number
  nome: string
  imagem?: string | null
  abertura: string
  fechamento: string
  descricao?: string | null
  endereco: {
    id: number
    cep: string
    logradouro: string
    numero?: string | null
    complemento?: string | null
    bairro: string
    cidade: string
    estado: string
  }
}

export type ProdutoCardapio = ProdutoRead & {
  imagemLocal?: string
}

export type SecaoCardapio = {
  id: string
  categoria_id: number
  titulo: string
  destaque?: boolean
  produtos: ProdutoCardapio[]
}
