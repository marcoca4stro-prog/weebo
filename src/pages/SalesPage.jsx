import { Plus, ShoppingBag } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import RecentSales from '../components/RecentSales'

export default function SalesPage({ sales, onNewSale, onMarkPaid }) {
  return <><div className="section-header"><div><h2>Vendas</h2><p>Acompanhe pedidos, pagamentos e produtos vendidos.</p></div><button className="primary action-button" onClick={onNewSale}><Plus size={17} />Nova venda</button></div>{sales.length === 0 ? <section className="panel entity-panel"><EmptyState icon={ShoppingBag} title="Nenhuma venda registrada" description="Cadastre produtos e clientes; depois registre sua primeira venda." actionLabel="Registrar venda" onAction={onNewSale} /></section> : <RecentSales sales={sales} showAll onMarkPaid={onMarkPaid} />}</>
}
