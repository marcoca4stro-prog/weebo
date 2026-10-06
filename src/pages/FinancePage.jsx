import { CircleDollarSign, Plus, CreditCard } from 'lucide-react'
import { useState } from 'react'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { formatCurrency, formatDate, makeId } from '../data'
import { ensureSaleInstallments } from '../utils/installments'

const initialForm = { description: '', date: new Date().toISOString().slice(0, 10), value: '' }

export default function FinancePage({
  sales,
  expenses,
  setExpenses,
  onMarkPaid,
  onOpenPayment
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)

  const normalizedSales = sales.map(ensureSaleInstallments)

  const entries = [
    ...normalizedSales.map((sale) => ({
      id: sale.id,
      date: sale.date,
      description: `Venda • ${sale.customerName} (${sale.productName})`,
      type: 'Receita',
      value: sale.total,
      paidAmount: sale.paidAmount,
      remainingAmount: sale.remainingAmount,
      status: sale.status,
      rawSale: sale
    })),
    ...expenses.map((item) => ({
      ...item,
      type: 'Despesa',
      status: 'Pago',
      paidAmount: item.value,
      remainingAmount: 0
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  // Cálculos financeiros ultra precisos considerando parcelas e antecipações
  const received = normalizedSales.reduce((sum, item) => sum + (item.paidAmount || 0), 0)
  const pending = normalizedSales.reduce((sum, item) => sum + (item.remainingAmount || 0), 0)
  const spent = expenses.reduce((sum, item) => sum + item.value, 0)

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function submit(event) {
    event.preventDefault()
    setExpenses((current) => [{ ...form, id: makeId(), value: Number(form.value) }, ...current])
    setForm(initialForm)
    setOpen(false)
  }

  return (
    <>
      <div className="section-header">
        <div>
          <h2>Financeiro</h2>
          <p>Entradas, parcelas recebidas, valores pendentes e despesas.</p>
        </div>
        <button className="primary action-button" onClick={() => setOpen(true)}>
          <Plus size={17} />
          Nova despesa
        </button>
      </div>

      <section className="finance-summary">
        <article>
          <span>Recebido</span>
          <strong style={{ color: '#2ea86e' }}>{formatCurrency(received)}</strong>
        </article>
        <article>
          <span>A receber (pendente)</span>
          <strong style={{ color: '#f40675' }}>{formatCurrency(pending)}</strong>
        </article>
        <article>
          <span>Despesas</span>
          <strong>{formatCurrency(spent)}</strong>
        </article>
        <article>
          <span>Saldo em caixa</span>
          <strong>{formatCurrency(received - spent)}</strong>
        </article>
      </section>

      <section className="panel entity-panel">
        {entries.length === 0 ? (
          <EmptyState
            icon={CircleDollarSign}
            title="Nenhuma movimentação"
            description="As vendas e despesas aparecerão aqui automaticamente."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Valor Total</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((item) => (
                  <tr key={`${item.type}-${item.id}`}>
                    <td>{formatDate(item.date)}</td>
                    <td className="strong-cell">{item.description}</td>
                    <td>
                      <span className={`entry-type ${item.type === 'Despesa' ? 'expense' : ''}`}>
                        {item.type}
                      </span>
                    </td>
                    <td>
                      {item.type === 'Receita' ? (
                        item.remainingAmount <= 0 ? (
                          <span className="status paid">Pago</span>
                        ) : item.paidAmount > 0 ? (
                          <span className="status partial-paid">
                            Parcial ({formatCurrency(item.remainingAmount)} pend.)
                          </span>
                        ) : (
                          <span className="status pending">A receber</span>
                        )
                      ) : (
                        <span className="status paid">Pago</span>
                      )}
                    </td>
                    <td className="currency">
                      {item.type === 'Despesa' ? '− ' : ''}
                      {formatCurrency(item.value)}
                    </td>
                    <td>
                      {item.type === 'Receita' && item.remainingAmount > 0 && (
                        <button
                          type="button"
                          className="inline-action pay-action-highlight"
                          onClick={() => {
                            if (onOpenPayment && item.rawSale) {
                              onOpenPayment(item.rawSale)
                            } else if (onMarkPaid) {
                              onMarkPaid(item.id)
                            }
                          }}
                        >
                          <CreditCard size={13} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                          Receber parcelas
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={open}
        title="Nova despesa"
        description="Registre uma saída para acompanhar seu saldo."
        onClose={() => setOpen(false)}
      >
        <form onSubmit={submit}>
          <label>
            Descrição
            <input
              required
              name="description"
              value={form.description}
              onChange={change}
              placeholder="Ex.: compra de sacolas / embalagens"
            />
          </label>
          <div className="field-row">
            <label>
              Data
              <input required type="date" name="date" value={form.date} onChange={change} />
            </label>
            <label>
              Valor (R$)
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                name="value"
                value={form.value}
                onChange={change}
              />
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button className="primary">Salvar despesa</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
