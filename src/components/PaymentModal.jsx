import { useState } from 'react'
import Modal from './Modal'
import { formatCurrency, formatDate } from '../data'
import {
  ensureSaleInstallments,
  paySingleInstallment,
  revertSingleInstallment,
  anticipatePayment,
  payAllRemainingInstallments
} from '../utils/installments'
import { CheckCircle2, Clock, AlertCircle, ArrowRight, DollarSign } from 'lucide-react'

export default function PaymentModal({
  open,
  sale,
  onClose,
  onSaveSale
}) {
  const [anticipateValue, setAnticipateValue] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [activeTab, setActiveTab] = useState('installments') // 'installments' | 'anticipate'

  if (!sale) return null

  const currentSale = ensureSaleInstallments(sale)
  const { total, paidAmount, remainingAmount, installmentsList = [] } = currentSale
  const percentPaid = total > 0 ? Math.min(100, Math.round((paidAmount / total) * 100)) : 100

  function handlePayInstallment(instId) {
    const updated = paySingleInstallment(currentSale, instId, paymentDate)
    onSaveSale(updated)
  }

  function handleRevertInstallment(instId) {
    const updated = revertSingleInstallment(currentSale, instId)
    onSaveSale(updated)
  }

  function handlePayAll() {
    if (window.confirm(`Deseja marcar todas as parcelas restantes como PAGAS (total de ${formatCurrency(remainingAmount)})?`)) {
      const updated = payAllRemainingInstallments(currentSale, paymentDate)
      onSaveSale(updated)
    }
  }

  function handleAnticipateSubmit(e) {
    e.preventDefault()
    const val = Number(anticipateValue)
    if (!val || val <= 0) {
      alert('Informe um valor válido para antecipar.')
      return
    }

    if (val > remainingAmount) {
      if (!window.confirm(`O valor informado (${formatCurrency(val)}) é maior que o saldo restante (${formatCurrency(remainingAmount)}). Deseja quitar a venda inteira?`)) {
        return
      }
    }

    const updated = anticipatePayment(currentSale, val, paymentDate)
    onSaveSale(updated)
    setAnticipateValue('')
    setActiveTab('installments')
  }

  return (
    <Modal
      open={open}
      title="Pagamentos & Parcelas"
      description={`Gerencie o recebimento das parcelas ou antecipe valores de ${currentSale.customerName}.`}
      onClose={onClose}
    >
      <div className="payment-modal-content">
        {/* Card Resumo do Pagamento */}
        <div className="payment-summary-card">
          <div className="payment-summary-top">
            <div>
              <span className="payment-customer-name">{currentSale.customerName}</span>
              <p className="payment-prod-sub">{currentSale.productName}</p>
            </div>
            <div className="payment-status-badge-wrap">
              <span className={`status-badge-pill ${remainingAmount <= 0 ? 'paid' : 'pending'}`}>
                {remainingAmount <= 0 ? 'Quitado' : `Resta ${formatCurrency(remainingAmount)}`}
              </span>
            </div>
          </div>

          {/* Barra de Progresso do Pagamento */}
          <div className="payment-progress-bar-wrap">
            <div className="payment-progress-bar" style={{ width: `${percentPaid}%` }} />
          </div>

          <div className="payment-metrics-row">
            <div>
              <small>Valor Total</small>
              <strong>{formatCurrency(total)}</strong>
            </div>
            <div>
              <small>Já Pago</small>
              <strong style={{ color: '#2ea86e' }}>{formatCurrency(paidAmount)}</strong>
            </div>
            <div>
              <small>Saldo Restante</small>
              <strong style={{ color: remainingAmount > 0 ? '#f40675' : '#2ea86e' }}>
                {formatCurrency(remainingAmount)}
              </strong>
            </div>
          </div>
        </div>

        {/* Abas: Parcelas vs Antecipar Valor */}
        <div className="payment-tabs">
          <button
            type="button"
            className={`payment-tab-btn ${activeTab === 'installments' ? 'active' : ''}`}
            onClick={() => setActiveTab('installments')}
          >
            Parcelas ({installmentsList.filter((i) => i.status === 'Pago').length}/{installmentsList.length})
          </button>
          <button
            type="button"
            className={`payment-tab-btn ${activeTab === 'anticipate' ? 'active' : ''}`}
            onClick={() => setActiveTab('anticipate')}
          >
            + Antecipar Valor
          </button>
        </div>

        {/* Conteúdo Aba 1: Lista de Parcelas */}
        {activeTab === 'installments' && (
          <div className="installments-list-section">
            <div className="installments-action-bar">
              <label className="pay-date-label">
                <span>Data do recebimento:</span>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </label>

              {remainingAmount > 0 && (
                <button
                  type="button"
                  className="quick-pay-all-btn"
                  onClick={handlePayAll}
                  title="Marcar todas as parcelas restantes como pagas"
                >
                  <CheckCircle2 size={14} /> Quitar tudo ({formatCurrency(remainingAmount)})
                </button>
              )}
            </div>

            <div className="installments-cards-grid">
              {installmentsList.map((inst) => {
                const isPaid = inst.status === 'Pago'
                return (
                  <div
                    key={inst.id || inst.number}
                    className={`installment-item-card ${isPaid ? 'paid' : 'pending'}`}
                  >
                    <div className="inst-card-info">
                      <div className="inst-card-header">
                        <span className="inst-number">
                          {inst.number}ª Parcela {inst.totalInstallments > 1 ? `de ${inst.totalInstallments}` : ''}
                        </span>
                        <span className={`inst-badge ${isPaid ? 'paid' : 'pending'}`}>
                          {isPaid ? (
                            <>
                              <CheckCircle2 size={12} /> Pago
                            </>
                          ) : (
                            <>
                              <Clock size={12} /> Pendente
                            </>
                          )}
                        </span>
                      </div>
                      <div className="inst-values">
                        <strong className="inst-val">{formatCurrency(inst.value)}</strong>
                        <small className="inst-due">
                          {isPaid
                            ? `Recebido em ${formatDate(inst.paidAt || paymentDate)}`
                            : `Vencimento: ${formatDate(inst.dueDate)}`}
                        </small>
                      </div>
                    </div>

                    <div className="inst-card-actions">
                      {isPaid ? (
                        <button
                          type="button"
                          className="inst-revert-btn"
                          onClick={() => handleRevertInstallment(inst.id || inst.number)}
                          title="Desfazer recebimento desta parcela"
                        >
                          Desfazer
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="inst-pay-btn"
                          onClick={() => handlePayInstallment(inst.id || inst.number)}
                        >
                          <CheckCircle2 size={14} /> Receber
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Conteúdo Aba 2: Formulário de Antecipação */}
        {activeTab === 'anticipate' && (
          <form onSubmit={handleAnticipateSubmit} className="anticipate-form">
            <div className="anticipate-tip-box">
              <DollarSign size={20} className="tip-icon" />
              <div>
                <strong>Antecipação de Valores</strong>
                <p>
                  A cliente fez um Pix ou pagou adiantado? Digite o valor recebido e o sistema dará baixa
                  automaticamente nas próximas parcelas a vencer.
                </p>
              </div>
            </div>

            <div className="field-row">
              <label>
                Valor recebido / adiantado (R$) *
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="Ex: 50,00"
                  value={anticipateValue}
                  onChange={(e) => setAnticipateValue(e.target.value)}
                  autoFocus
                />
              </label>

              <label>
                Data do recebimento
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </label>
            </div>

            {anticipateValue && Number(anticipateValue) > 0 && (
              <div className="anticipate-preview-box">
                <small>Saldo restante após esta antecipação:</small>
                <strong>
                  {formatCurrency(Math.max(0, remainingAmount - Number(anticipateValue)))}
                </strong>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setActiveTab('installments')}
              >
                Voltar às parcelas
              </button>
              <button type="submit" className="primary">
                Confirmar Antecipação
              </button>
            </div>
          </form>
        )}

        {/* Rodapé do Modal */}
        <div className="modal-actions" style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <button type="button" className="primary" onClick={onClose}>
            Concluído
          </button>
        </div>
      </div>
    </Modal>
  )
}
