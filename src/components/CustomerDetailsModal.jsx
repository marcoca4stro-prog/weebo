import { useState } from 'react'
import Modal from './Modal'
import { formatCurrency, formatDate } from '../data'
import { getCustomerBalance, ensureSaleInstallments } from '../utils/installments'
import { CheckCircle2, Clock, AlertCircle, ShoppingBag, Calendar, DollarSign, ArrowUpRight } from 'lucide-react'

export default function CustomerDetailsModal({
  open,
  customer,
  sales = [],
  onClose,
  onOpenPaymentModal,
  onNewSaleForCustomer
}) {
  if (!customer) return null

  const balance = getCustomerBalance(customer, sales)
  const { customerSales, totalSpent, totalPaid, totalPending, pendingInstallments } = balance

  return (
    <Modal
      open={open}
      title={`Extrato & Cobrança • ${customer.name}`}
      description="Consolidado de todas as compras, parcelas e valores pendentes desta cliente."
      onClose={onClose}
    >
      <div className="customer-details-content">
        {/* Card do Saldo Consolidado */}
        <div className="customer-balance-banner">
          <div className="cust-balance-main">
            <span className="balance-label">Total a receber desta cliente:</span>
            <strong className={`balance-value ${totalPending > 0 ? 'has-debt' : 'paid-up'}`}>
              {formatCurrency(totalPending)}
            </strong>
            <small className="balance-note">
              {totalPending > 0
                ? `Possui ${pendingInstallments.length} parcela(s) pendente(s) somando todas as compras.`
                : 'Esta cliente está com todos os pagamentos em dia! 🎉'}
            </small>
          </div>

          <div className="cust-balance-metrics">
            <div className="metric-pill">
              <small>Total Comprado</small>
              <b>{formatCurrency(totalSpent)}</b>
            </div>
            <div className="metric-pill">
              <small>Já Pago</small>
              <b style={{ color: '#2ea86e' }}>{formatCurrency(totalPaid)}</b>
            </div>
            <div className="metric-pill">
              <small>Total de Compras</small>
              <b>{customerSales.length} pedidos</b>
            </div>
          </div>
        </div>

        {/* Seção 1: Parcelas Pendentes da Cliente (se houver) */}
        {totalPending > 0 && (
          <div className="cust-pending-section">
            <div className="cust-section-title">
              <Clock size={16} color="#f40675" />
              <strong>Parcelas Pendentes a Vencer ({pendingInstallments.length})</strong>
            </div>

            <div className="cust-installments-list">
              {pendingInstallments.map((inst, idx) => (
                <div key={inst.id || `${inst.saleId}-${idx}`} className="cust-inst-card">
                  <div className="cust-inst-left">
                    <span className="cust-inst-title">
                      {inst.number}ª Parcela ({inst.productName})
                    </span>
                    <span className="cust-inst-meta">
                      Vencimento: <b>{formatDate(inst.dueDate)}</b> • Compra de {formatDate(inst.saleDate)}
                    </span>
                  </div>

                  <div className="cust-inst-right">
                    <strong className="cust-inst-val">{formatCurrency(inst.value)}</strong>
                    <button
                      type="button"
                      className="primary cust-receive-btn"
                      onClick={() => {
                        const targetSale = sales.find((s) => s.id === inst.saleId)
                        if (targetSale) {
                          onOpenPaymentModal(targetSale)
                        }
                      }}
                    >
                      Receber parcela
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção 2: Histórico de Compras da Cliente */}
        <div className="cust-history-section">
          <div className="cust-section-title">
            <ShoppingBag size={16} />
            <strong>Todas as Compras Realizadas ({customerSales.length})</strong>
          </div>

          {customerSales.length === 0 ? (
            <p className="no-sales-msg">Nenhuma compra registrada para esta cliente.</p>
          ) : (
            <div className="cust-sales-table-wrap">
              <table className="cust-sales-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Produtos</th>
                    <th>Total</th>
                    <th>Já Pago</th>
                    <th>Pendente</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {customerSales.map((sale) => {
                    const normSale = ensureSaleInstallments(sale)
                    return (
                      <tr key={normSale.id}>
                        <td>{formatDate(normSale.date)}</td>
                        <td className="cust-sale-products">
                          <strong>{normSale.productName}</strong>
                          {normSale.items && normSale.items.length > 1 && (
                            <small className="cust-items-sub">
                              {normSale.items.map((it) => `${it.productName} (${it.quantity}x)`).join(', ')}
                            </small>
                          )}
                        </td>
                        <td>{formatCurrency(normSale.total)}</td>
                        <td style={{ color: '#2ea86e' }}>{formatCurrency(normSale.paidAmount)}</td>
                        <td style={{ color: normSale.remainingAmount > 0 ? '#f40675' : 'inherit', fontWeight: 'bold' }}>
                          {formatCurrency(normSale.remainingAmount)}
                        </td>
                        <td>
                          <span className={`status ${normSale.status === 'Pago' ? 'paid' : 'pending'}`}>
                            {normSale.status === 'Pago' ? 'Pago' : `${normSale.installments}x Parc.`}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="inline-action"
                            onClick={() => onOpenPaymentModal(normSale)}
                          >
                            Gerenciar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ações do Rodapé */}
        <div className="modal-actions" style={{ justifyContent: 'space-between', display: 'flex', marginTop: 20 }}>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              onClose()
              if (onNewSaleForCustomer) onNewSaleForCustomer(customer)
            }}
          >
            + Nova compra para {customer.name.split(' ')[0]}
          </button>
          <button type="button" className="primary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  )
}
