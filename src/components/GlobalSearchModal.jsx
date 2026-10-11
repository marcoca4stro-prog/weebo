import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search,
  X,
  ShoppingBag,
  User,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react'
import { formatCurrency, formatDate } from '../data'

export default function GlobalSearchModal({
  open,
  onClose,
  sales = [],
  products = [],
  customers = [],
  onNavigate,
  onOpenPayment,
  onEditSale,
  onOpenCustomer
}) {
  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all' | 'sales' | 'customers' | 'products'
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      setQuery('')
      setFilterType('all')
    }
  }, [open])

  const normalized = query.trim().toLocaleLowerCase('pt-BR')

  const results = useMemo(() => {
    if (!normalized) return { sales: [], customers: [], products: [], total: 0 }

    const matchedSales = sales.filter((s) => {
      const target = `${s.customerName} ${s.productName} ${s.brand} ${s.paymentMethod || ''} ${s.status || ''} ${s.notes || ''}`.toLocaleLowerCase('pt-BR')
      return target.includes(normalized)
    })

    const matchedCustomers = customers.filter((c) => {
      const target = `${c.name} ${c.phone || ''} ${c.email || ''} ${c.notes || ''}`.toLocaleLowerCase('pt-BR')
      return target.includes(normalized)
    })

    const matchedProducts = products.filter((p) => {
      const target = `${p.name} ${p.brand || ''} ${p.category || ''} ${p.sku || ''}`.toLocaleLowerCase('pt-BR')
      return target.includes(normalized)
    })

    return {
      sales: matchedSales,
      customers: matchedCustomers,
      products: matchedProducts,
      total: matchedSales.length + matchedCustomers.length + matchedProducts.length
    }
  }, [normalized, sales, customers, products])

  if (!open) return null

  return (
    <div className="global-search-backdrop" onClick={onClose}>
      <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho da Busca */}
        <div className="global-search-header">
          <div className="global-search-input-wrap">
            <Search size={18} className="search-icon" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar lançamento, venda, cliente ou produto..."
              aria-label="Buscar no sistema"
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setQuery('')}
                title="Limpar busca"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button type="button" className="search-close-pill" onClick={onClose}>
            Fechar
          </button>
        </div>

        {/* Filtros rápidos por categoria */}
        {normalized && (
          <div className="search-category-tabs">
            <button
              type="button"
              className={`search-tab ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              Todos ({results.total})
            </button>
            <button
              type="button"
              className={`search-tab ${filterType === 'sales' ? 'active' : ''}`}
              onClick={() => setFilterType('sales')}
            >
              Vendas / Lançamentos ({results.sales.length})
            </button>
            <button
              type="button"
              className={`search-tab ${filterType === 'customers' ? 'active' : ''}`}
              onClick={() => setFilterType('customers')}
            >
              Clientes ({results.customers.length})
            </button>
            <button
              type="button"
              className={`search-tab ${filterType === 'products' ? 'active' : ''}`}
              onClick={() => setFilterType('products')}
            >
              Produtos ({results.products.length})
            </button>
          </div>
        )}

        {/* Área de Resultados */}
        <div className="global-search-body">
          {!normalized ? (
            <div className="search-empty-state">
              <div className="search-hint-icon">
                <Search size={28} />
              </div>
              <h3>Busca Global do Sistema</h3>
              <p>Digite o nome de uma cliente, produto, marca, valor ou qualquer termo para encontrar imediatamente.</p>
              
              {/* Sugestões de acesso rápido */}
              <div className="search-quick-tags">
                <span className="quick-tag-label">Dicas de busca:</span>
                <button type="button" onClick={() => setQuery('O Boticário')}>O Boticário</button>
                <button type="button" onClick={() => setQuery('WePink')}>WePink</button>
                <button type="button" onClick={() => setQuery('pendente')}>Pendente</button>
                <button type="button" onClick={() => setQuery('pago')}>Pago</button>
              </div>
            </div>
          ) : results.total === 0 ? (
            <div className="search-empty-state">
              <h3>Nenhum resultado encontrado</h3>
              <p>Não encontramos nenhum lançamento, cliente ou produto correspondente a "{query}".</p>
            </div>
          ) : (
            <div className="search-results-list">
              {/* Seção Vendas / Lançamentos */}
              {(filterType === 'all' || filterType === 'sales') && results.sales.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">
                    <ShoppingBag size={15} />
                    <span>Vendas e Lançamentos ({results.sales.length})</span>
                  </div>
                  {results.sales.slice(0, 15).map((sale) => (
                    <div
                      key={sale.id}
                      className="search-item-row"
                      onClick={() => {
                        onClose()
                        if (onEditSale) {
                          onEditSale(sale)
                        } else if (onNavigate) {
                          onNavigate('Lançamentos')
                        }
                      }}
                    >
                      <div className="search-item-icon sale-icon">
                        <ShoppingBag size={16} />
                      </div>
                      <div className="search-item-info">
                        <div className="search-item-primary">
                          <strong>{sale.customerName}</strong>
                          <span className={`search-badge status-${sale.status === 'pago' ? 'paid' : 'pending'}`}>
                            {sale.status === 'pago' ? 'Pago' : 'Pendente'}
                          </span>
                        </div>
                        <div className="search-item-secondary">
                          <span>{sale.productName || (sale.items?.length ? `${sale.items.length} itens` : 'Venda')}</span>
                          <span>•</span>
                          <span className="search-brand-tag">{sale.brand}</span>
                          {sale.date && (
                            <>
                              <span>•</span>
                              <span>{formatDate(sale.date)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="search-item-meta">
                        <span className="search-price">{formatCurrency(sale.totalAmount || sale.value || 0)}</span>
                        {sale.remainingAmount > 0 && (
                          <small className="search-remaining">Restam {formatCurrency(sale.remainingAmount)}</small>
                        )}
                      </div>
                      <ChevronRight size={16} className="chevron" />
                    </div>
                  ))}
                </div>
              )}

              {/* Seção Clientes */}
              {(filterType === 'all' || filterType === 'customers') && results.customers.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">
                    <User size={15} />
                    <span>Clientes ({results.customers.length})</span>
                  </div>
                  {results.customers.slice(0, 10).map((customer) => (
                    <div
                      key={customer.id}
                      className="search-item-row"
                      onClick={() => {
                        onClose()
                        if (onOpenCustomer) {
                          onOpenCustomer(customer)
                        } else if (onNavigate) {
                          onNavigate('Clientes')
                        }
                      }}
                    >
                      <div className="search-item-icon customer-icon">
                        <User size={16} />
                      </div>
                      <div className="search-item-info">
                        <div className="search-item-primary">
                          <strong>{customer.name}</strong>
                        </div>
                        <div className="search-item-secondary">
                          <span>{customer.phone || 'Sem telefone'}</span>
                          {customer.email && (
                            <>
                              <span>•</span>
                              <span>{customer.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} className="chevron" />
                    </div>
                  ))}
                </div>
              )}

              {/* Seção Produtos */}
              {(filterType === 'all' || filterType === 'products') && results.products.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">
                    <Package size={15} />
                    <span>Produtos no Estoque ({results.products.length})</span>
                  </div>
                  {results.products.slice(0, 10).map((product) => (
                    <div
                      key={product.id}
                      className="search-item-row"
                      onClick={() => {
                        onClose()
                        if (onNavigate) onNavigate('Estoque')
                      }}
                    >
                      <div className="search-item-icon product-icon">
                        <Package size={16} />
                      </div>
                      <div className="search-item-info">
                        <div className="search-item-primary">
                          <strong>{product.name}</strong>
                          <span className="search-brand-tag">{product.brand}</span>
                        </div>
                        <div className="search-item-secondary">
                          <span>Estoque: <b>{product.stock} un.</b></span>
                          {product.category && (
                            <>
                              <span>•</span>
                              <span>{product.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="search-item-meta">
                        <span className="search-price">{formatCurrency(product.price || 0)}</span>
                      </div>
                      <ChevronRight size={16} className="chevron" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
