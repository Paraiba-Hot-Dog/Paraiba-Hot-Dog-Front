import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import logoBranca from '../../../imagens/logos/logo-branca.png'

type ExportarDashboardPdfParams = {
  /** Blocos do dashboard, na ordem em que entram no PDF. Cada um fica inteiro numa página. */
  blocos: HTMLElement[]
  busca: string
  nomeArquivo: string
  /** Período por extenso, ex.: "01/09/2026 a 30/09/2026 · 30 dias". */
  periodo: string
  /** Título do relatório, ex.: "Relatório de setembro de 2026". */
  titulo: string
  unidade: string
}

// Medidas em milímetros (A4 retrato).
const PAGINA = { largura: 210, altura: 297 }
const MARGEM = 12
const LARGURA_CONTEUDO = PAGINA.largura - MARGEM * 2
const ALTURA_CABECALHO = 30
const ALTURA_CABECALHO_CONTINUACAO = 12
const ALTURA_RODAPE = 12
const ESPACO_ENTRE_BLOCOS = 4

const CORES = {
  preto: [0, 0, 0],
  amarelo: [255, 204, 0],
  vermelho: [201, 21, 33],
  texto: [36, 50, 71],
  textoSuave: [125, 142, 164],
  fundo: [237, 242, 248],
} as const satisfies Record<string, readonly [number, number, number]>

function carregarImagem(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const imagem = new Image()
    imagem.onload = () => resolve(imagem)
    imagem.onerror = () => reject(new Error('Nao foi possivel carregar o logo do relatorio.'))
    imagem.src = src
  })
}

/** Escreve o texto no maior tamanho (até `tamanhoMaximo`) que caiba na largura disponível. */
function textoQueCabe(pdf: jsPDF, texto: string, x: number, y: number, larguraMaxima: number, tamanhoMaximo: number) {
  let tamanho = tamanhoMaximo
  pdf.setFontSize(tamanho)
  while (tamanho > 10 && pdf.getTextWidth(texto) > larguraMaxima) {
    tamanho -= 0.5
    pdf.setFontSize(tamanho)
  }
  pdf.text(texto, x, y)
}

function desenharCabecalho(
  pdf: jsPDF,
  logo: HTMLImageElement,
  { busca, periodo, titulo, unidade }: ExportarDashboardPdfParams,
) {
  pdf.setFillColor(...CORES.preto)
  pdf.rect(0, 0, PAGINA.largura, ALTURA_CABECALHO, 'F')
  pdf.setFillColor(...CORES.amarelo)
  pdf.rect(0, ALTURA_CABECALHO, PAGINA.largura, 1.5, 'F')
  pdf.addImage(logo, 'PNG', MARGEM - 4, -1, 32, 32)

  const xTexto = MARGEM + 32
  const agora = new Date()
  const geradoEm = `Gerado em ${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  const larguraGeradoEm = pdf.getTextWidth(geradoEm)
  pdf.setTextColor(200, 200, 200)
  pdf.text(geradoEm, PAGINA.largura - MARGEM, 21, { align: 'right' })

  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  textoQueCabe(pdf, titulo, xTexto, 14, PAGINA.largura - MARGEM - xTexto, 20)
  pdf.setTextColor(...CORES.amarelo)
  pdf.setFontSize(10.5)
  pdf.text(`${unidade}  •  Paraíba Hot Dog`, xTexto, 21, {
    maxWidth: PAGINA.largura - MARGEM - xTexto - larguraGeradoEm - 6,
  })

  const filtros = [
    ['Período', periodo],
    ['Unidade', unidade],
    ...(busca.trim() ? [['Pesquisa', `"${busca.trim()}"`]] : []),
  ]
  let x = MARGEM
  const y = ALTURA_CABECALHO + 8
  filtros.forEach(([rotulo, valor]) => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(...CORES.textoSuave)
    pdf.text(rotulo.toUpperCase(), x, y)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(...CORES.texto)
    pdf.text(valor, x, y + 5.5)
    x += Math.max(pdf.getTextWidth(valor), pdf.getTextWidth(rotulo)) + 12
  })

  return y + 11
}

function desenharCabecalhoContinuacao(pdf: jsPDF, titulo: string, unidade: string) {
  pdf.setFillColor(...CORES.preto)
  pdf.rect(0, 0, PAGINA.largura, ALTURA_CABECALHO_CONTINUACAO, 'F')
  pdf.setFillColor(...CORES.amarelo)
  pdf.rect(0, ALTURA_CABECALHO_CONTINUACAO, PAGINA.largura, 1, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(255, 255, 255)
  pdf.text(titulo, MARGEM, 7.5)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...CORES.amarelo)
  pdf.text(`${unidade}  •  Paraíba Hot Dog`, PAGINA.largura - MARGEM, 7.5, { align: 'right' })

  return ALTURA_CABECALHO_CONTINUACAO + 6
}

function desenharRodapes(pdf: jsPDF, titulo: string) {
  const totalPaginas = pdf.getNumberOfPages()

  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    pdf.setPage(pagina)
    const y = PAGINA.altura - 6
    pdf.setDrawColor(216, 225, 237)
    pdf.line(MARGEM, y - 4, PAGINA.largura - MARGEM, y - 4)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(...CORES.textoSuave)
    pdf.text(`Paraíba Hot Dog  •  ${titulo}`, MARGEM, y)
    pdf.text(`Página ${pagina} de ${totalPaginas}`, PAGINA.largura - MARGEM, y, { align: 'right' })
  }
}

// Captura na largura atual da janela: os gráficos SVG têm largura fixa em pixels, então
// forçar outra largura faria eles vazarem dos cards.
function capturarBloco(bloco: HTMLElement) {
  return html2canvas(bloco, {
    backgroundColor: `rgb(${CORES.fundo.join(',')})`,
    logging: false,
    scale: 2,
    useCORS: true,
  })
}

export async function exportarDashboardPdf(params: ExportarDashboardPdfParams) {
  const logo = await carregarImagem(logoBranca)
  const capturas: HTMLCanvasElement[] = []

  for (const bloco of params.blocos) {
    capturas.push(await capturarBloco(bloco))
  }

  const pdf = new jsPDF({ format: 'a4', orientation: 'portrait', unit: 'mm' })
  pdf.setProperties({ title: `${params.titulo} - ${params.unidade}`, author: 'Paraíba Hot Dog' })
  pdf.setFillColor(...CORES.fundo)
  pdf.rect(0, 0, PAGINA.largura, PAGINA.altura, 'F')

  const limiteInferior = PAGINA.altura - ALTURA_RODAPE
  let y = desenharCabecalho(pdf, logo, params)

  capturas.forEach((captura) => {
    let largura = LARGURA_CONTEUDO
    let altura = (captura.height * largura) / captura.width
    const alturaMaxima = limiteInferior - (ALTURA_CABECALHO_CONTINUACAO + 6)

    // Um bloco maior que a página inteira é reduzido para caber sem ser cortado.
    if (altura > alturaMaxima) {
      largura *= alturaMaxima / altura
      altura = alturaMaxima
    }

    if (y + altura > limiteInferior) {
      pdf.addPage()
      pdf.setFillColor(...CORES.fundo)
      pdf.rect(0, 0, PAGINA.largura, PAGINA.altura, 'F')
      y = desenharCabecalhoContinuacao(pdf, params.titulo, params.unidade)
    }

    const x = MARGEM + (LARGURA_CONTEUDO - largura) / 2
    pdf.addImage(captura.toDataURL('image/jpeg', 0.92), 'JPEG', x, y, largura, altura)
    y += altura + ESPACO_ENTRE_BLOCOS
  })

  desenharRodapes(pdf, params.titulo)
  pdf.save(params.nomeArquivo)
}
