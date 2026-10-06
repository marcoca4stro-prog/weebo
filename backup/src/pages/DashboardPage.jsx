import { Boxes, ShoppingBag, TrendingUp, WalletCards } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import MetricCard from '../components/MetricCard'
import RecentSales from '../components/RecentSales'
import SalesChart from '../components/SalesChart'
import { formatCurrency, formatDate } from '../data'

const filterOptions = ['Todas as marcas', 'O Boticário', 'WePink']

export default function DashboardPage({ brand, setBrand, sales, products, onNewSale, onNavigate }) {
  const filtered = brand === 'Todas as marcas' ? sales : sales.filter((item) => item.brand === brand)
  const total = filtered.reduce((sum, sale) => sum + sale.total, 0)
  const profit = filtered.reduce((sum, sale) => sum + sale.total - sale.unitCost * sale.quantity, 0)
  const receivables = filtered.filter((sale) => sale.status === 'A receber')
  const pending = receivables.reduce((sum, sale) => sum + sale.total, 0)
  const lowStock = products.filter((item) => Number(item.stock) <= Number(item.minStock))
  return <>
    <div className="mobile-title"><h1>Olá, Bianca</h1><p>Veja como estão suas vendas hoje.</p></div>
    <div className="dashboard-toolbar"><div><h2>Resumo do negócio</h2><p>Acompanhe as duas marcas em um só lugar.</p></div><div className="brand-filter" role="group" aria-label="Filtrar por marca">{filterOptions.map((item) => <button key={item} onClick={() => setBrand(item)} className={brand === item ? 'selected' : ''}>{item}</button>)}</div></div>
    <section className="metrics">
      <MetricCard icon={TrendingUp} label="Vendas no mês" value={formatCurrency(total)} note={sales.length === 0 ? 'Nenhuma venda registrada' : `${filtered.length} vendas registradas`} />
      <MetricCard icon={TrendingUp} label="Lucro estimado" value={formatCurrency(profit)} note="Vendas menos custo dos produtos" tone="pink" />
      <MetricCard icon={WalletCards} label="A receber" value={formatCurrency(pending)} note={`${receivables.length} vendas pendentes`} />
      <MetricCard icon={Boxes} label="Estoque baixo" value={`${lowStock.length} produtos`} note="No limite definido para reposição" tone="pink" />
    </section>
    <div className="dashboard-grid">
      <div className="primary-column"><SalesChart brand={brand} sales={filtered} />{filtered.length > 0 ? <RecentSales sales={filtered.slice(0, 5)} /> : <section className="panel sales-panel"><div className="panel-heading"><h2>Últimas vendas</h2></div><EmptyState compact icon={ShoppingBag} title="Nenhuma venda por aqui" description="Registre a primeira venda para iniciar o histórico." actionLabel="Nova venda" onAction={onNewSale} /></section>}</div>
      <aside className="side-column">
        <section className="panel compact-panel"><div className="panel-heading"><h2>A receber</h2><button className="text-button" onClick={() => onNavigate('Financeiro')}>Ver todos</button></div>{receivables.length === 0 ? <EmptyState compact icon={WalletCards} title="Tudo em dia" description="Nenhum valor pendente." /> : <div className="compact-list">{receivables.slice(0, 4).map((item) => <div className="compact-row" key={item.id}><div><strong>{item.customerName}</strong><small>{item.dueDate ? `Vence em ${formatDate(item.dueDate)}` : 'Sem vencimento'}</small></div><b>{formatCurrency(item.total)}</b></div>)}</div>}</section>
        <section className="panel compact-panel"><div className="panel-heading"><h2>Estoque baixo</h2><button className="text-button" onClick={() => onNavigate('Estoque')}>Ver todos</button></div>{lowStock.length === 0 ? <EmptyState compact icon={Boxes} title="Estoque sob controle" description={products.length === 0 ? 'Cadastre produtos para acompanhar.' : 'Nenhum item precisa de reposição.'} /> : <div className="stock-list">{lowStock.slice(0, 5).map((item) => <div className="stock-row" key={item.id}><span className={`stock-dot ${item.brand === 'WePink' ? 'wp' : 'ob'}`} /><div><strong>{item.name}</strong><small>{item.brand}</small></div><b>{item.stock} un.</b></div>)}</div>}</section>
      </aside>
    </div>
  </>
}
