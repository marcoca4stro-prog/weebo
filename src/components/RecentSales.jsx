import { formatCurrency, formatDate } from '../data'
import { Pencil, CreditCard, ShoppingBag, CheckCircle } from 'lucide-react'
import { ensureSaleInstallments } from '../utils/installments'

export default function RecentSales({
  sales,
  showAll = false,
  onMarkPaid,
  onEditSale,
  onOpenPayment
}) {
  return (
    <section className="panel sales-panel">
      <div className="panel-heading">
        <h2>{showAll ? 'Todas as vendas' : 'Últimas vendas'}</h2>
        {!showAll && <span className="panel-count">{sales.length} registros</span>}
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Cliente</th>
              <th>Marca</th>
              <th>Produtos</th>
              <th>Pagamento</th>
              <th>Status / Parcelas</th>
              <th>Valor Total</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((rawSale) => {
              const sale = ensureSaleInstallments(rawSale)
              const hasMultipleItems = sale.items && sale.items.length > 1
              const paidInstCount = (sale.installmentsList || []).filter((i) => i.status === 'Pago').length
              const totalInstCount = sale.installments || (sale.installmentsList || []).length || 1
              const isPartial = sale.paidAmount > 0 && sale.remainingAmount > 0

              return (
                <tr key={sale.id}>
                  <td>{formatDate(sale.date)}</td>
                  <td className="customer-cell">
                    <strong>{sale.customerName}</strong>
                  </td>
                  <td>
                    <span className={`brand-mark ${sale.brand === 'WePink' ? 'wp' : 'ob'}`}>
                      {sale.brand}
                    </span>
                  </td>
                  <td className="product-cell">
                    <div className="prod-cell-content">
                      <span className="prod-title">{sale.productName}</span>
                      {hasMultipleItems ? (
                        <span className="multi-items-badge" title={sale.items.map((i) => `${i.productName} (${i.quantity}x)`).join(', ')}>
                          {sale.items.length} itens no pedido
                        </span>
                      ) : (
                        <span className="single-item-qty">× {sale.quantity}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {sale.payment}
                    {sale.installments > 1
                      ? ` (${sale.installments}x de ${formatCurrency(
                          sale.installmentValue || sale.total / sale.installments
                        )})`
                      : ''}
                  </td>
                  <td>
                    {sale.status === 'Pago' ? (
                      <span
                        className="status paid"
                        style={{ cursor: onOpenPayment ? 'pointer' : 'default' }}
                        onClick={() => onOpenPayment && onOpenPayment(sale)}
                        title="Ver parcelas quitadas"
                      >
                        ✓ Quitado
                      </span>
                    ) : isPartial ? (
                      <span
                        className="status partial-paid"
                        style={{ cursor: onOpenPayment ? 'pointer' : 'default' }}
                        onClick={() => onOpenPayment && onOpenPayment(sale)}
                        title={`Pago ${formatCurrency(sale.paidAmount)} de ${formatCurrency(sale.total)}. Resta ${formatCurrency(sale.remainingAmount)}`}
                      >
                        {paidInstCount}/{totalInstCount} pagas ({formatCurrency(sale.remainingAmount)} pend.)
                      </span>
                    ) : (
                      <span
                        className="status pending"
                        style={{ cursor: onOpenPayment ? 'pointer' : 'default' }}
                        onClick={() => onOpenPayment && onOpenPayment(sale)}
                        title={sale.dueDate ? `Vence em ${formatDate(sale.dueDate)}` : 'Pendente'}
                      >
                        A receber {totalInstCount > 1 ? `(${totalInstCount}x)` : ''}
                      </span>
                    )}
                  </td>
                  <td className="currency">
                    <div>
                      <strong>{formatCurrency(sale.total)}</strong>
                      {sale.remainingAmount > 0 && sale.paidAmount > 0 && (
                        <small style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                          Resta: {formatCurrency(sale.remainingAmount)}
                        </small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {/* Botão de Parcelas / Receber */}
                      {onOpenPayment && sale.status !== 'Pago' ? (
                        <button
                          type="button"
                          className="inline-action pay-action-highlight"
                          onClick={() => onOpenPayment(sale)}
                          title="Registrar pagamento de parcela ou antecipação"
                        >
                          <CreditCard size={13} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                          {totalInstCount > 1 ? 'Parcelas' : 'Receber'}
                        </button>
                      ) : onMarkPaid && sale.status !== 'Pago' ? (
                        <button
                          type="button"
                          className="inline-action"
                          onClick={() => onMarkPaid(sale.id)}
                        >
                          Receber
                        </button>
                      ) : onOpenPayment ? (
                        <button
                          type="button"
                          className="inline-action receipt-view-btn"
                          onClick={() => onOpenPayment(sale)}
                          title="Ver comprovante das parcelas"
                        >
                          Ver parcelas
                        </button>
                      ) : null}

                      {/* Botão Editar */}
                      {onEditSale && (
                        <button
                          type="button"
                          className="inline-action edit-action-btn"
                          onClick={() => onEditSale(sale)}
                          title="Editar lançamento"
                        >
                          <Pencil size={13} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                          Editar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
