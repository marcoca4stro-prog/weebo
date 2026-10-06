import { Plus, UsersRound, Eye, Clock, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import CustomerDetailsModal from '../components/CustomerDetailsModal'
import { formatCurrency, makeId } from '../data'
import { getCustomerBalance } from '../utils/installments'

const initialForm = { name: '', phone: '', email: '', notes: '' }

export default function CustomersPage({
  customers,
  setCustomers,
  sales,
  onOpenPaymentModal,
  onNewSaleForCustomer
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState(null)
  const [filterPendingOnly, setFilterPendingOnly] = useState(false)

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function submit(event) {
    event.preventDefault()
    setCustomers((current) => [{ ...form, id: makeId() }, ...current])
    setForm(initialForm)
    setOpen(false)
  }

  // Estatísticas consolidadas
  const customersWithBalances = customers.map((customer) => {
    const balance = getCustomerBalance(customer, sales)
    return {
      ...customer,
      ...balance
    }
  })

  const totalPendingAllCustomers = customersWithBalances.reduce(
    (sum, c) => sum + (c.totalPending || 0),
    0
  )

  const customersWithDebt = customersWithBalances.filter((c) => c.totalPending > 0)

  const displayedCustomers = filterPendingOnly
    ? customersWithBalances.filter((c) => c.totalPending > 0)
    : customersWithBalances

  return (
    <>
      <div className="section-header">
        <div>
          <h2>Clientes</h2>
          <p>Acompanhe contatos, compras separadas e quanto tem a receber de cada cliente.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="primary action-button" onClick={() => setOpen(true)}>
            <Plus size={17} />
            Nova cliente
          </button>
        </div>
      </div>

      {/* Cards de Resumo de Cobrança por Cliente */}
      {customers.length > 0 && (
        <section className="customers-summary-banner">
          <div className="cust-summary-card">
            <span>Total de Clientes</span>
            <strong>{customers.length}</strong>
          </div>
          <div
            className={`cust-summary-card clickable ${filterPendingOnly ? 'active-filter' : ''}`}
            onClick={() => setFilterPendingOnly((prev) => !prev)}
            title="Clique para filtrar apenas clientes com pendências"
          >
            <span>Clientes com débito</span>
            <strong style={{ color: '#f40675' }}>
              {customersWithDebt.length} clientes
            </strong>
            <small>{filterPendingOnly ? 'Exibindo devedoras (clique para ver todas)' : 'Clique para filtrar'}</small>
          </div>
          <div className="cust-summary-card highlight-debt">
            <span>Total a receber de todas as clientes</span>
            <strong style={{ color: '#f40675' }}>
              {formatCurrency(totalPendingAllCustomers)}
            </strong>
            <small>Soma de todas as compras e parcelas pendentes</small>
          </div>
        </section>
      )}

      <section className="panel entity-panel">
        {customers.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="Nenhum cliente cadastrado"
            description="Adicione sua primeira cliente para vincular às vendas."
            actionLabel="Cadastrar cliente"
            onAction={() => setOpen(true)}
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Telefone</th>
                  <th>Compras</th>
                  <th>Total Comprado</th>
                  <th>Já Pago</th>
                  <th>A Receber (Saldo Devedor)</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {displayedCustomers.map((customer) => {
                  const hasDebt = customer.totalPending > 0

                  return (
                    <tr key={customer.id}>
                      <td className="strong-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{customer.name}</span>
                          {hasDebt && (
                            <span className="debt-indicator-dot" title="Possui saldo pendente a receber" />
                          )}
                        </div>
                      </td>
                      <td>{customer.phone || '—'}</td>
                      <td>
                        <span className="badge-pill-subtle">
                          {customer.salesCount} {customer.salesCount === 1 ? 'pedido' : 'pedidos'}
                        </span>
                      </td>
                      <td>{formatCurrency(customer.totalSpent)}</td>
                      <td style={{ color: '#2ea86e' }}>{formatCurrency(customer.totalPaid)}</td>
                      <td>
                        {hasDebt ? (
                          <div className="debt-cell-wrap">
                            <strong className="debt-amount-highlight">
                              {formatCurrency(customer.totalPending)}
                            </strong>
                            <small className="debt-sub-info">
                              {customer.pendingInstallments.length} parc. pend.
                            </small>
                          </div>
                        ) : (
                          <span className="status paid" style={{ fontSize: '11px', padding: '2px 8px' }}>
                            ✓ Em dia
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="inline-action customer-statement-btn"
                            onClick={() => setSelectedCustomerForDetails(customer)}
                            title="Ver extrato completo, compras e parcelas da cliente"
                          >
                            <Eye size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            Extrato & Parcelas
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de Nova Cliente */}
      <Modal
        open={open}
        title="Nova cliente"
        description="Cadastre apenas os dados necessários para o atendimento."
        onClose={() => setOpen(false)}
      >
        <form onSubmit={submit}>
          <label>
            Nome
            <input
              required
              name="name"
              value={form.name}
              onChange={change}
              placeholder="Nome completo da cliente"
            />
          </label>
          <div className="field-row">
            <label>
              Telefone (WhatsApp)
              <input
                name="phone"
                value={form.phone}
                onChange={change}
                placeholder="(00) 00000-0000"
              />
            </label>
            <label>
              E-mail
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={change}
                placeholder="cliente@email.com"
              />
            </label>
          </div>
          <label>
            Observações
            <textarea
              name="notes"
              value={form.notes}
              onChange={change}
              placeholder="Preferências, endereço ou informações úteis"
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button className="primary">Salvar cliente</button>
          </div>
        </form>
      </Modal>

      {/* Modal de Extrato Consolidado da Cliente */}
      {selectedCustomerForDetails && (
        <CustomerDetailsModal
          open={Boolean(selectedCustomerForDetails)}
          customer={selectedCustomerForDetails}
          sales={sales}
          onClose={() => setSelectedCustomerForDetails(null)}
          onOpenPaymentModal={(sale) => {
            setSelectedCustomerForDetails(null)
            if (onOpenPaymentModal) onOpenPaymentModal(sale)
          }}
          onNewSaleForCustomer={(cust) => {
            setSelectedCustomerForDetails(null)
            if (onNewSaleForCustomer) onNewSaleForCustomer(cust)
          }}
        />
      )}
    </>
  )
}
