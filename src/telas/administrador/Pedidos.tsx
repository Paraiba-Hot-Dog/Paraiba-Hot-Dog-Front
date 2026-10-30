import BarraDeNavegacaoAdmin, { CLASSE_OFFSET_BARRA_ADMIN } from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import PedidosCentralizados from '../../componentes/administrador/PedidosCentralizados'

export default function Pedidos() {
  return <><BarraDeNavegacaoAdmin /><main className={`${CLASSE_OFFSET_BARRA_ADMIN} min-h-screen bg-[#f8f9fb]`}><div className="px-4 py-6 sm:px-8 sm:py-8"><PedidosCentralizados /></div></main></>
}
