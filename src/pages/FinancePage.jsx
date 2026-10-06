import { CircleDollarSign, Plus } from 'lucide-react'
import { useState } from 'react'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { formatCurrency, formatDate, makeId } from '../data'

const initialForm = { description: '', date: new Date().toISOString().slice(0, 10), value: '' }

export default function FinancePage({ sales, expenses, setExpenses, onMarkPaid }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const entries = [
    ...sales.map((sale) => ({ id: sale.id, date: sale.date, description: `Venda • ${sale.customerName}`, type: 'Receita', value: sale.total, status: sale.status })),
    ...expenses.map((item) => ({ ...item, type: 'Despesa', status: 'Pago' })),
  ].sort((a, b) => b.date.localeCompare(a.date))
  const received = sales.filter((item) => item.status === 'Pago').reduce((sum, item) => sum + item.total, 0)
  const pending = sales.filter((item) => item.status === 'A receber').reduce((sum, item) => sum + item.total, 0)
  const spent = expenses.reduce((sum, item) => sum + item.value, 0)
  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  function submit(event) { event.preventDefault(); setExpenses((current) => [{ ...form, id: makeId(), value: Number(form.value) }, ...current]); setForm(initialForm); setOpen(false) }
  return <>
    <div className="section-header"><div><h2>Financeiro</h2><p>Entradas, valores pendentes e despesas.</p></div><button className="primary action-button" onClick={() => setOpen(true)}><Plus size={17} />Nova despesa</button></div>
    <section className="finance-summary"><article><span>Recebido</span><strong>{formatCurrency(received)}</strong></article><article><span>A receber</span><strong>{formatCurrency(pending)}</strong></article><article><span>Despesas</span><strong>{formatCurrency(spent)}</strong></article><article><span>Saldo</span><strong>{formatCurrency(received - spent)}</strong></article></section>
    <section className="panel entity-panel">{entries.length === 0 ? <EmptyState icon={CircleDollarSign} title="Nenhuma movimentação" description="As vendas e despesas aparecerão aqui automaticamente." /> : <div className="table-scroll"><table><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Status</th><th>Valor</th><th></th></tr></thead><tbody>{entries.map((item) => <tr key={`${item.type}-${item.id}`}><td>{formatDate(item.date)}</td><td className="strong-cell">{item.description}</td><td><span className={`entry-type ${item.type === 'Despesa' ? 'expense' : ''}`}>{item.type}</span></td><td>{item.status}</td><td className="currency">{item.type === 'Despesa' ? '− ' : ''}{formatCurrency(item.value)}</td><td>{item.type === 'Receita' && item.status === 'A receber' && <button className="inline-action" onClick={() => onMarkPaid(item.id)}>Marcar como pago</button>}</td></tr>)}</tbody></table></div>}</section>
    <Modal open={open} title="Nova despesa" description="Registre uma saída para acompanhar seu saldo." onClose={() => setOpen(false)}><form onSubmit={submit}><label>Descrição<input required name="description" value={form.description} onChange={change} placeholder="Ex.: compra de sacolas" /></label><div className="field-row"><label>Data<input required type="date" name="date" value={form.date} onChange={change} /></label><label>Valor<input required min="0.01" step="0.01" type="number" name="value" value={form.value} onChange={change} /></label></div><div className="modal-actions"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="primary">Salvar despesa</button></div></form></Modal>
  </>
}
