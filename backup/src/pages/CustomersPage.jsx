import { Plus, UsersRound } from 'lucide-react'
import { useState } from 'react'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { formatCurrency, makeId } from '../data'

const initialForm = { name: '', phone: '', email: '', notes: '' }

export default function CustomersPage({ customers, setCustomers, sales }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  function submit(event) { event.preventDefault(); setCustomers((current) => [{ ...form, id: makeId() }, ...current]); setForm(initialForm); setOpen(false) }
  return <>
    <div className="section-header"><div><h2>Clientes</h2><p>Contatos, compras e valores pendentes.</p></div><button className="primary action-button" onClick={() => setOpen(true)}><Plus size={17} />Novo cliente</button></div>
    <section className="panel entity-panel">{customers.length === 0 ? <EmptyState icon={UsersRound} title="Nenhum cliente cadastrado" description="Adicione sua primeira cliente para vincular às vendas." actionLabel="Cadastrar cliente" onAction={() => setOpen(true)} /> : <div className="table-scroll"><table><thead><tr><th>Cliente</th><th>Telefone</th><th>E-mail</th><th>Compras</th><th>Total comprado</th><th>A receber</th></tr></thead><tbody>{customers.map((customer) => { const history = sales.filter((sale) => sale.customerId === customer.id); return <tr key={customer.id}><td className="strong-cell">{customer.name}</td><td>{customer.phone || '—'}</td><td>{customer.email || '—'}</td><td>{history.length}</td><td>{formatCurrency(history.reduce((sum, sale) => sum + sale.total, 0))}</td><td>{formatCurrency(history.filter((sale) => sale.status === 'A receber').reduce((sum, sale) => sum + sale.total, 0))}</td></tr> })}</tbody></table></div>}</section>
    <Modal open={open} title="Novo cliente" description="Cadastre apenas os dados necessários para o atendimento." onClose={() => setOpen(false)}><form onSubmit={submit}><label>Nome<input required name="name" value={form.name} onChange={change} placeholder="Nome completo" /></label><div className="field-row"><label>Telefone<input name="phone" value={form.phone} onChange={change} placeholder="(00) 00000-0000" /></label><label>E-mail<input type="email" name="email" value={form.email} onChange={change} placeholder="cliente@email.com" /></label></div><label>Observações<textarea name="notes" value={form.notes} onChange={change} placeholder="Preferências ou informações úteis" /></label><div className="modal-actions"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="primary">Salvar cliente</button></div></form></Modal>
  </>
}
