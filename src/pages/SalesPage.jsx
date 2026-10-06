import { Plus, ShoppingBag, Users, ListFilter } from 'lucide-react'
import { useState } from 'react'
import EmptyState from '../components/EmptyState'
import RecentSales from '../components/RecentSales'
import { formatCurrency, formatDate } from '../data'
import { ensureSaleInstallments } from '../utils/installments'

export default function SalesPage({
  sales,
  onNewSale,
  onMarkPaid,
  onEditSale,
  onOpenPayment,
  onViewCustomerStatement
}) {
  const [viewMode, setViewMode] = useState('all') // 'all' | 'by-customer'

  // Agrupamento consolidado por cliente para clientes que possuem valores a receber
  const normalizedSales = sales.map(ensureSaleInstallments)

  const customersPendingMap = {}
  normalizedSales.forEach((sale) => {
    if (sale.remainingAmount > 0) {
      const key = sale.customerId || sale.customerName
      if (!customersPendingMap[key]) {
        customersPendingMap[key] = {
          customerId: sale.customerId,
          customerName: sale.customerName,
          totalPending: 0,
          totalPurchased: 0,
          salesCount: 0,
          sales: [],
          nextDueDate: sale.dueDate || ''
        }
      }
      customersPendingMap[key].totalPending += sale.remainingAmount
      customersPendingMap[key].totalPurchased += sale.total
      customersPendingMap[key].salesCount += 1
      customersPendingMap[key].sales.push(sale)

      if (sale.dueDate && (!customersPendingMap[key].nextDueDate || sale.dueDate < customersPendingMap[key].nextDueDate)) {
        customersPendingMap[key].nextDueDate = sale.dueDate
      }
    }
  })

  const customersPendingList = Object.values(customersPendingMap).sort(
    (a, b) => b.totalPending - a.totalPending
  )

  const totalReceivables = customersPendingList.reduce((sum, c) => sum + c.totalPending, 0)

  return (
    <>
      <div className="section-header">
        <div>
          <h2>Lançamentos & Cobrança</h2>
          <p>Acompanhe pedidos, parcelas pendentes e quanto tem a receber de cada cliente.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Alternador de visualização */}
          <div className="view-mode-pill-toggle">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              Todos os lançamentos
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'by-customer' ? 'active' : ''}`}
              onClick={() => setViewMode('by-customer')}
            >
              A receber por cliente ({customersPendingList.length})
            </button>
          </div>

          <button className="primary action-button" onClick={onNewSale}>
            <Plus size={17} />
            Novo lançamento
          </button>
        </div>
      </div>

      {viewMode === 'by-customer' ? (
        <section className="panel entity-panel">
          <div className="panel-heading">
            <div>
              <h2>Valores a Receber Consolidados por Cliente</h2>
              <p>Soma de todas as compras separadas e parcelas pendentes de cada cliente.</p>
            </div>
            <span className="panel-count" style={{ color: '#f40675', fontWeight: 'bold' }}>
              Total: {formatCurrency(totalReceivables)}
            </span>
          </div>

          {customersPendingList.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Nenhum valor pendente a receber!"
              description="Todas as clientes estão com seus pagamentos em dia."
            />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Compras Pendentes</th>
                    <th>Próximo Vencimento</th>
                    <th>Total Acumulado a Receber</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {customersPendingList.map((client) => (
                    <tr key={client.customerId || client.customerName}>
                      <td className="strong-cell">
                        <strong>{client.customerName}</strong>
                      </td>
                      <td>
                        <span className="badge-pill-subtle">
                          {client.salesCount} {client.salesCount === 1 ? 'compra com pendência' : 'compras somadas'}
                        </span>
                      </td>
                      <td>
                        {client.nextDueDate ? (
                          <span style={{ color: '#f40675', fontWeight: 600 }}>
                            {formatDate(client.nextDueDate)}
                          </span>
                        ) : (
                          'A combinar'
                        )}
                      </td>
                      <td>
                        <strong className="debt-amount-highlight">
                          {formatCurrency(client.totalPending)}
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {client.sales.length === 1 ? (
                            <button
                              type="button"
                              className="inline-action pay-action-highlight"
                              onClick={() => onOpenPayment && onOpenPayment(client.sales[0])}
                            >
                              Receber parcelas
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="inline-action customer-statement-btn"
                              onClick={() => onViewCustomerStatement && onViewCustomerStatement(client)}
                            >
                              Ver extrato ({client.sales.length} compras)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : sales.length === 0 ? (
        <section className="panel entity-panel">
          <EmptyState
            icon={ShoppingBag}
            title="Nenhum lançamento registrado"
            description="Lance uma venda com múltiplos produtos ou produtos individuais."
            actionLabel="Fazer lançamento"
            onAction={onNewSale}
          />
        </section>
      ) : (
        <RecentSales
          sales={sales}
          showAll
          onMarkPaid={onMarkPaid}
          onEditSale={onEditSale}
          onOpenPayment={onOpenPayment}
        />
      )}
    </>
  )
}
