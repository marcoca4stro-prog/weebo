import { useMemo } from 'react'
import { Boxes, ShoppingBag, TrendingUp, Trophy, WalletCards } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import MetricCard from '../components/MetricCard'
import RecentSales from '../components/RecentSales'
import SalesChart from '../components/SalesChart'
import { formatCurrency, formatDate } from '../data'

const filterOptions = [
  { label: 'Todas as marcas', dot: null },
  { label: 'O Boticário', dot: 'ob' },
  { label: 'WePink', dot: 'wp' }
]

export default function DashboardPage({ brand, setBrand, sales, products, onNewSale, onNavigate, todayLabel, onEditSale, onMarkPaid }) {
  const filtered = brand === 'Todas as marcas' ? sales : sales.filter((item) => item.brand === brand)
  const total = filtered.reduce((sum, sale) => sum + sale.total, 0)
  const profit = filtered.reduce((sum, sale) => sum + sale.total - sale.unitCost * sale.quantity, 0)
  const receivables = filtered.filter((sale) => sale.status === 'A receber')
  const pending = receivables.reduce((sum, sale) => sum + sale.total, 0)
  const lowStock = products.filter((item) => Number(item.stock) <= Number(item.minStock))

  const topSelling = useMemo(() => {
    const map = {}
    filtered.forEach((sale) => {
      const key = sale.productId || sale.productName
      if (!map[key]) {
        map[key] = {
          id: key,
          name: sale.productName,
          brand: sale.brand,
          quantity: 0,
          totalRevenue: 0,
        }
      }
      map[key].quantity += Number(sale.quantity || 0)
      map[key].totalRevenue += Number(sale.total || 0)
    })
    return Object.values(map)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [filtered])

  return <>
    <div className="mobile-title">
      <h1>Olá, Bianca Alves</h1>
      <p>{todayLabel || 'Segunda-feira, 5 de outubro de 2026'}</p>
    </div>

    <div className="welcome-banner">
      <div className="welcome-banner-text">
        <h2>
          Bem-vinda à <span className="weebo-pink">Weebo!</span>
        </h2>
        <p>Acompanhe suas vendas, estoque e finanças em um só lugar.</p>
      </div>
      <div className="welcome-banner-art">
        <img src="/banner-cosmetics.png" alt="Beleza, Organização, Crescimento" />
      </div>
    </div>

    <div className="dashboard-toolbar">
      <div>
        <h2>Resumo do negócio</h2>
        <p>Acompanhe as duas marcas em um só lugar.</p>
      </div>
      <div className="brand-filter" role="group" aria-label="Filtrar por marca">
        {filterOptions.map((item) => (
          <button
            key={item.label}
            onClick={() => setBrand(item.label)}
            className={`${brand === item.label ? 'selected' : ''} ${item.dot ? `filter-${item.dot}` : ''}`}
          >
            {item.dot && <span className={`filter-dot ${item.dot}`} />}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
    <section className="metrics">
      <MetricCard icon={TrendingUp} label="Vendas no mês" value={formatCurrency(total)} note={sales.length === 0 ? 'Nenhuma venda registrada' : `${filtered.length} vendas registradas`} />
      <MetricCard icon={TrendingUp} label="Lucro estimado" value={formatCurrency(profit)} note="Vendas menos custo dos produtos" tone="pink" />
      <MetricCard icon={WalletCards} label="A receber" value={formatCurrency(pending)} note={`${receivables.length} vendas pendentes`} />
      <MetricCard icon={Boxes} label="Estoque baixo" value={`${lowStock.length} produtos`} note="No limite definido para reposição" tone="pink" />
    </section>
    <div className="dashboard-grid">
      <div className="primary-column">
        <SalesChart brand={brand} sales={filtered} />
        {filtered.length > 0 ? (
          <RecentSales sales={filtered.slice(0, 5)} onEditSale={onEditSale} onMarkPaid={onMarkPaid} />
        ) : (
          <section className="panel sales-panel">
            <div className="panel-heading"><h2>Últimas vendas</h2></div>
            <EmptyState compact icon={ShoppingBag} title="Nenhuma venda por aqui" description="Registre a primeira venda para iniciar o histórico." actionLabel="Nova venda" onAction={onNewSale} />
          </section>
        )}
      </div>
      <aside className="side-column">
        <section className="panel compact-panel top-products-panel">
          <div className="panel-heading">
            <div>
              <h2>Produtos mais vendidos</h2>
              <p>Ranqueados por unidades vendidas</p>
            </div>
            {topSelling.length > 0 && <span className="panel-count">{topSelling.length} no ranking</span>}
          </div>
          {topSelling.length === 0 ? (
            <EmptyState compact icon={Trophy} title="Sem vendas no período" description="Os produtos mais vendidos aparecerão aqui conforme as vendas forem registradas." />
          ) : (
            <div className="top-products-list">
              {topSelling.map((item, index) => {
                const maxQty = topSelling[0]?.quantity || 1
                const percent = Math.min(100, Math.round((item.quantity / maxQty) * 100))
                return (
                  <div className="top-product-row" key={item.id}>
                    <div className={`rank-badge rank-${index + 1}`}>{index + 1}º</div>
                    <div className="top-product-info">
                      <div className="top-product-title">
                        <strong>{item.name}</strong>
                        <span className={`brand-mark ${item.brand === 'WePink' ? 'wp' : 'ob'}`}>{item.brand}</span>
                      </div>
                      <div className="top-product-bar-wrap">
                        <div className="top-product-bar" style={{ width: `${percent}%` }} />
                      </div>
                      <small>{formatCurrency(item.totalRevenue)} em faturamento</small>
                    </div>
                    <div className="top-product-qty">
                      <b>{item.quantity} un.</b>
                      <small>vendidas</small>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
        <section className="panel compact-panel">
          <div className="panel-heading"><h2>A receber</h2><button className="text-button" onClick={() => onNavigate('Financeiro')}>Ver todos</button></div>
          {receivables.length === 0 ? <EmptyState compact icon={WalletCards} title="Tudo em dia" description="Nenhum valor pendente." /> : <div className="compact-list">{receivables.slice(0, 4).map((item) => <div className="compact-row" key={item.id}><div><strong>{item.customerName}</strong><small>{item.dueDate ? `Vence em ${formatDate(item.dueDate)}` : 'Sem vencimento'}</small></div><b>{formatCurrency(item.total)}</b></div>)}</div>}
        </section>
        <section className="panel compact-panel">
          <div className="panel-heading"><h2>Estoque baixo</h2><button className="text-button" onClick={() => onNavigate('Estoque')}>Ver todos</button></div>
          {lowStock.length === 0 ? <EmptyState compact icon={Boxes} title="Estoque sob controle" description={products.length === 0 ? 'Cadastre produtos para acompanhar.' : 'Nenhum item precisa de reposição.'} /> : <div className="stock-list">{lowStock.slice(0, 5).map((item) => <div className="stock-row" key={item.id}><span className={`stock-dot ${item.brand === 'WePink' ? 'wp' : 'ob'}`} /><div><strong>{item.name}</strong><small>{item.brand}</small></div><b>{item.stock} un.</b></div>)}</div>}
        </section>
      </aside>
    </div>
  </>
}
