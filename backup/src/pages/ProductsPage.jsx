import { Boxes, Plus } from 'lucide-react'
import { useState } from 'react'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { BRAND_OPTIONS, formatCurrency, makeId } from '../data'

const initialForm = { name: '', brand: 'O Boticário', category: '', stock: '', minStock: '2', cost: '', price: '' }

export default function ProductsPage({ products, setProducts }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  function submit(event) {
    event.preventDefault()
    setProducts((current) => [{ ...form, id: makeId(), stock: Number(form.stock), minStock: Number(form.minStock), cost: Number(form.cost), price: Number(form.price) }, ...current])
    setForm(initialForm); setOpen(false)
  }
  return <>
    <div className="section-header"><div><h2>Estoque</h2><p>Produtos disponíveis e necessidade de reposição.</p></div><button className="primary action-button" onClick={() => setOpen(true)}><Plus size={17} />Novo produto</button></div>
    <section className="panel entity-panel">
      {products.length === 0 ? <EmptyState icon={Boxes} title="Seu estoque está vazio" description="Cadastre o primeiro produto para começar a registrar vendas." actionLabel="Cadastrar produto" onAction={() => setOpen(true)} /> : <div className="table-scroll"><table><thead><tr><th>Produto</th><th>Marca</th><th>Categoria</th><th>Quantidade</th><th>Custo</th><th>Venda</th><th>Situação</th></tr></thead><tbody>{products.map((item) => <tr key={item.id}><td className="strong-cell">{item.name}</td><td><span className={`brand-mark ${item.brand === 'WePink' ? 'wp' : 'ob'}`}>{item.brand}</span></td><td>{item.category || '—'}</td><td>{item.stock} un.</td><td>{formatCurrency(item.cost)}</td><td>{formatCurrency(item.price)}</td><td><span className={`status ${item.stock <= item.minStock ? 'pending' : 'paid'}`}>{item.stock <= item.minStock ? 'Repor' : 'Em estoque'}</span></td></tr>)}</tbody></table></div>}
    </section>
    <Modal open={open} title="Novo produto" description="Informe estoque, custo e preço de venda." onClose={() => setOpen(false)}><form onSubmit={submit}><label>Nome do produto<input required name="name" value={form.name} onChange={change} placeholder="Ex.: Body splash 200 ml" /></label><div className="field-row"><label>Marca<select name="brand" value={form.brand} onChange={change}>{BRAND_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label><label>Categoria<input name="category" value={form.category} onChange={change} placeholder="Perfumaria, cuidados..." /></label></div><div className="field-row"><label>Quantidade inicial<input required min="0" type="number" name="stock" value={form.stock} onChange={change} /></label><label>Estoque mínimo<input required min="0" type="number" name="minStock" value={form.minStock} onChange={change} /></label></div><div className="field-row"><label>Custo unitário<input required min="0" step="0.01" type="number" name="cost" value={form.cost} onChange={change} /></label><label>Preço de venda<input required min="0" step="0.01" type="number" name="price" value={form.price} onChange={change} /></label></div><div className="modal-actions"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="primary">Salvar produto</button></div></form></Modal>
  </>
}
