import type { CentralOrder, OrderItem } from './ifoodApi'
import { dataHora, moeda, responsavelEntrega } from './pedidoApresentacao'

const escapar = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

function linhasItem(item: OrderItem, nivel = 0): string {
  const recuo = nivel === 0 ? '' : `style="padding-left:${nivel * 10}px"`
  const nome = `${nivel === 0 ? '' : '+ '}${escapar(item.quantity)} × ${escapar(item.name)}`
  return `<div class="${nivel === 0 ? 'item' : 'opcao'}" ${recuo}>${nivel === 0 ? `<strong>${nome}</strong>` : nome}</div>`
    + [...(item.options ?? []), ...(item.customization ?? [])].map((sub) => linhasItem(sub, nivel + 1)).join('')
    + (item.observations ? `<div class="obs">OBS: ${escapar(item.observations)}</div>` : '')
}

/** Kitchen ticket for an iFood order. Never includes CPF or the pickup code; the address only for own delivery. */
export function comandaHtml(order: CentralOrder) {
  const p = order.payload ?? {}
  const entregaPropria = order.order_type === 'DELIVERY' && order.delivered_by === 'MERCHANT'
  const address = p.delivery?.deliveryAddress
  const methods = p.payments?.methods ?? []
  const observacoes = [p.extraInfo, p.delivery?.observations, p.takeout?.observations].filter(Boolean)
  const horario = p.schedule?.deliveryDateTimeStart
    ? `Agendado: ${dataHora(p.schedule.deliveryDateTimeStart)} – ${dataHora(p.schedule.deliveryDateTimeEnd)}`
    : p.takeout?.takeoutDateTime ? `Retirada: ${dataHora(p.takeout.takeoutDateTime)}` : ''
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapar(order.nome)}</title><style>
    @page { size: 80mm auto; margin: 4mm }
    body { font: 13px/1.35 ui-monospace, Menlo, Consolas, monospace; color: #000; width: 72mm; margin: 0 }
    h1 { font-size: 20px; margin: 0 } .centro { text-align: center } hr { border: 0; border-top: 1px dashed #000; margin: 6px 0 }
    .item { margin-top: 6px } .opcao { font-size: 12px } .obs { font-weight: 700; margin: 2px 0 0 10px; white-space: pre-line }
    .linha { display: flex; justify-content: space-between; gap: 8px } .destaque { font-weight: 700; font-size: 15px }
  </style></head><body>
    <div class="centro"><div>iFood</div><h1>#${escapar(order.nome.replace(/^iFood #/, ''))}</h1><div>${escapar(dataHora(order.created_at))}</div></div>
    <hr><div class="destaque">${escapar(responsavelEntrega(order))}</div>${horario ? `<div>${escapar(horario)}</div>` : ''}
    ${p.customer?.name ? `<div>Cliente: ${escapar(p.customer.name)}</div>` : ''}
    <hr>${(p.items ?? []).map((item) => linhasItem(item)).join('')}
    ${observacoes.length ? `<hr><div class="obs" style="margin-left:0">OBSERVAÇÕES: ${observacoes.map(escapar).join(' · ')}</div>` : ''}
    ${entregaPropria && address ? `<hr><div><strong>Entrega</strong></div><div>${escapar(address.streetName)}, ${escapar(address.streetNumber)}</div><div>${escapar(address.neighborhood)} · ${escapar(address.city)}</div>${address.complement ? `<div>${escapar(address.complement)}</div>` : ''}${address.reference ? `<div>Ref.: ${escapar(address.reference)}</div>` : ''}` : ''}
    <hr>${methods.map((m) => `<div class="linha"><span>${escapar(m.method)}${m.card?.brand ? ` ${escapar(m.card.brand)}` : ''} · ${m.prepaid || m.type === 'ONLINE' ? 'pago online' : 'COBRAR'}</span><span>${escapar(moeda(m.value))}</span></div>${m.cash?.changeFor ? `<div>Troco para ${escapar(moeda(m.cash.changeFor))}</div>` : ''}`).join('')}
    <div class="linha destaque"><span>TOTAL</span><span>${escapar(moeda(order.total))}</span></div>
  </body></html>`
}

export function imprimirComanda(order: CentralOrder) {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  frame.srcdoc = comandaHtml(order)
  frame.onload = () => {
    // Registered before print(), which blocks until the dialog closes in most browsers.
    frame.contentWindow?.addEventListener('afterprint', () => frame.remove())
    window.setTimeout(() => frame.remove(), 60_000)
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
  }
  document.body.appendChild(frame)
}
