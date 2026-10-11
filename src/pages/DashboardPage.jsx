import { useMemo, useState } from 'react'
import {
  Boxes,
  ShoppingBag,
  SlidersHorizontal,
  TrendingUp,
  Trophy,
  WalletCards
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import MetricCard from '../components/MetricCard'
import RecentSales from '../components/RecentSales'
import SalesChart from '../components/SalesChart'
import CustomizeOverviewModal, { DEFAULT_OVERVIEW_SECTIONS } from '../components/CustomizeOverviewModal'
import useLocalStorage from '../hooks/useLocalStorage'
import { formatCurrency, formatDate } from '../data'
import { ensureSaleInstallments } from '../utils/installments'

const filterOptions = [
  { label: 'Todas as marcas', dot: null },
  { label: 'O Boticário', dot: 'ob' },
  { label: 'WePink', dot: 'wp' }
]

export default function DashboardPage({
  brand,
  setBrand,
  sales,
  products,
  onNewSale,
  onNavigate,
  todayLabel,
  onEditSale,
  onMarkPaid,
  onOpenPayment
}) {
  const [overviewSections, setOverviewSections] = useLocalStorage(
    'weebo:overview_sections',
    DEFAULT_OVERVIEW_SECTIONS
  )
  const [customizeOpen, setCustomizeOpen] = useState(false)

  const normalizedSales = useMemo(() => sales.map(ensureSaleInstallments), [sales])

  const filtered = useMemo(() => {
    if (brand === 'Todas as marcas') return normalizedSales
    return normalizedSales.filter(
      (item) => item.brand === brand || (item.items && item.items.some((it) => it.brand === brand))
    )
  }, [brand, normalizedSales])

  const total = filtered.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)
  const profit = filtered.reduce(
    (sum, sale) =>
      sum +
      (Number(sale.total) || 0) -
      (Number(sale.unitCost) || 0) * (Number(sale.quantity) || 1),
    0
  )
  const receivables = filtered.filter((sale) => sale.remainingAmount > 0)
  const pending = receivables.reduce((sum, sale) => sum + (Number(sale.remainingAmount) || 0), 0)
  const lowStock = products.filter((item) => Number(item.stock) <= Number(item.minStock || 0))

  const topSelling = useMemo(() => {
    const map = {}
    filtered.forEach((sale) => {
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach((item) => {
          const key = item.productId || item.productName
          if (!map[key]) {
            map[key] = {
              id: key,
              name: item.productName,
              brand: item.brand,
              quantity: 0,
              totalRevenue: 0
            }
          }
          map[key].quantity += Number(item.quantity || 0)
          map[key].totalRevenue += Number(item.total || 0)
        })
      } else {
        const key = sale.productId || sale.productName
        if (!map[key]) {
          map[key] = {
            id: key,
            name: sale.productName,
            brand: sale.brand,
            quantity: 0,
            totalRevenue: 0
          }
        }
        map[key].quantity += Number(sale.quantity || 0)
        map[key].totalRevenue += Number(sale.total || 0)
      }
    })
    return Object.values(map)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [filtered])

  function renderSection(id) {
    switch (id) {
      case 'brandFilter':
        return (
          <div key="brandFilter" className="dashboard-toolbar">
            <div className="dashboard-toolbar-heading">
              <div>
                <h2>Resumo do negócio</h2>
                <p>Acompanhe as duas marcas em um só lugar.</p>
              </div>
              <button
                type="button"
                className="desktop-customize-btn"
                onClick={() => setCustomizeOpen(true)}
                title="Personalizar e reordenar visualizações"
              >
                <SlidersHorizontal size={15} />
                <span>Personalizar tela</span>
              </button>
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
        )

      case 'metrics':
        return (
          <section key="metrics" className="metrics">
            <MetricCard
              icon={TrendingUp}
              label="Vendas registradas"
              value={formatCurrency(total)}
              note={sales.length === 0 ? 'Nenhuma venda registrada' : `${filtered.length} lançamentos`}
            />
            <MetricCard
              icon={TrendingUp}
              label="Lucro estimado"
              value={formatCurrency(profit)}
              note="Vendas menos custo dos produtos"
              tone="pink"
            />
            <MetricCard
              icon={WalletCards}
              label="A receber"
              value={formatCurrency(pending)}
              note={`${receivables.length} vendas com saldo pendente`}
            />
            <MetricCard
              icon={Boxes}
              label="Estoque baixo"
              value={`${lowStock.length} produtos`}
              note="No limite definido para reposição"
              tone="pink"
            />
          </section>
        )

      case 'salesChart':
        return (
          <div key="salesChart" className="dashboard-section-block">
            <SalesChart brand={brand} sales={filtered} />
          </div>
        )

      case 'recentSales':
        return (
          <div key="recentSales" className="dashboard-section-block">
            {filtered.length > 0 ? (
              <RecentSales
                sales={filtered.slice(0, 5)}
                onEditSale={onEditSale}
                onMarkPaid={onMarkPaid}
                onOpenPayment={onOpenPayment}
              />
            ) : (
              <section className="panel sales-panel">
                <div className="panel-heading">
                  <h2>Últimas vendas</h2>
                </div>
                <EmptyState
                  compact
                  icon={ShoppingBag}
                  title="Nenhuma venda por aqui"
                  description="Registre a primeira venda para iniciar o histórico."
                  actionLabel="Nova venda"
                  onAction={onNewSale}
                />
              </section>
            )}
          </div>
        )

      case 'topProducts':
        return (
          <section key="topProducts" className="panel compact-panel top-products-panel">
            <div className="panel-heading">
              <div>
                <h2>Produtos mais vendidos</h2>
                <p>Ranqueados por unidades vendidas</p>
              </div>
              {topSelling.length > 0 && <span className="panel-count">{topSelling.length} no ranking</span>}
            </div>
            {topSelling.length === 0 ? (
              <EmptyState
                compact
                icon={Trophy}
                title="Sem vendas no período"
                description="Os produtos mais vendidos aparecerão aqui conforme as vendas forem registradas."
              />
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
                          <span className={`brand-mark ${item.brand === 'WePink' ? 'wp' : 'ob'}`}>
                            {item.brand}
                          </span>
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
        )

      case 'receivables':
        return (
          <section key="receivables" className="panel compact-panel">
            <div className="panel-heading">
              <h2>A receber ({receivables.length})</h2>
              <button className="text-button" onClick={() => onNavigate('Financeiro')}>
                Ver todos
              </button>
            </div>
            {receivables.length === 0 ? (
              <EmptyState
                compact
                icon={WalletCards}
                title="Tudo em dia"
                description="Nenhum valor pendente."
              />
            ) : (
              <div className="compact-list">
                {receivables.slice(0, 4).map((item) => (
                  <div
                    className="compact-row"
                    key={item.id}
                    style={{ cursor: onOpenPayment ? 'pointer' : 'default' }}
                    onClick={() => onOpenPayment && onOpenPayment(item)}
                    title="Clique para gerenciar parcelas"
                  >
                    <div>
                      <strong>{item.customerName}</strong>
                      <small>
                        {item.dueDate ? `Vence em ${formatDate(item.dueDate)}` : 'Sem vencimento'}
                      </small>
                    </div>
                    <b style={{ color: '#f40675' }}>{formatCurrency(item.remainingAmount)}</b>
                  </div>
                ))}
              </div>
            )}
          </section>
        )

      case 'lowStock':
        return (
          <section key="lowStock" className="panel compact-panel">
            <div className="panel-heading">
              <h2>Estoque baixo</h2>
              <button className="text-button" onClick={() => onNavigate('Estoque')}>
                Ver todos
              </button>
            </div>
            {lowStock.length === 0 ? (
              <EmptyState
                compact
                icon={Boxes}
                title="Estoque sob controle"
                description={
                  products.length === 0
                    ? 'Cadastre produtos para acompanhar.'
                    : 'Nenhum item precisa de reposição.'
                }
              />
            ) : (
              <div className="stock-list">
                {lowStock.slice(0, 5).map((item) => (
                  <div className="stock-row" key={item.id}>
                    <span className={`stock-dot ${item.brand === 'WePink' ? 'wp' : 'ob'}`} />
                    <div>
                      <strong>{item.name}</strong>
                      <small>{item.brand}</small>
                    </div>
                    <b>{item.stock} un.</b>
                  </div>
                ))}
              </div>
            )}
          </section>
        )

      default:
        return null
    }
  }

  return (
    <>
      <div className="mobile-title">
        <div className="mobile-title-left">
          <h1>Olá, Bianca Alves</h1>
          <p>{todayLabel || 'Sexta-feira, 9 de outubro de 2026'}</p>
        </div>
        <button
          type="button"
          className="customize-overview-trigger"
          onClick={() => setCustomizeOpen(true)}
          title="Personalizar e reordenar visualizações"
          aria-label="Personalizar visualizações"
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      <div className="overview-dynamic-flow">
        {overviewSections
          .filter((sec) => sec.visible)
          .map((sec) => renderSection(sec.id))}
      </div>

      <CustomizeOverviewModal
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        sections={overviewSections}
        onSave={setOverviewSections}
      />
    </>
  )
}
