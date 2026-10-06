import { useMemo, useState } from 'react'
import Modal from './Modal'
import { PAYMENT_OPTIONS, makeId } from '../data'

const initialForm = { customerId: '', productId: '', quantity: 1, payment: 'PIX', status: 'Pago', dueDate: '' }

export default function NewSaleModal({ open, onClose, onSave, products, customers }) {
  const [form, setForm] = useState(initialForm)
  const product = useMemo(() => products.find((item) => item.id === form.productId), [products, form.productId])
  const total = product ? Number(product.price) * Number(form.quantity || 0) : 0

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function submit(event) {
    event.preventDefault()
    const customer = customers.find((item) => item.id === form.customerId)
    if (!customer || !product) return
    onSave({
      id: makeId(), date: new Date().toISOString().slice(0, 10),
      customerId: customer.id, customerName: customer.name,
      productId: product.id, productName: product.name, brand: product.brand,
      quantity: Number(form.quantity), unitPrice: Number(product.price), unitCost: Number(product.cost), total,
      payment: form.payment, status: form.status, dueDate: form.status === 'A receber' ? form.dueDate : '',
    })
    setForm(initialForm)
    onClose()
  }

  const unavailable = products.length === 0 || customers.length === 0
  return (
    <Modal open={open} title="Nova venda" description="Registre uma venda e atualize o estoque automaticamente." onClose={onClose}>
      {unavailable ? (
        <div className="form-warning"><strong>Antes de vender, complete os cadastros.</strong><p>{products.length === 0 ? 'Cadastre pelo menos um produto no Estoque. ' : ''}{customers.length === 0 ? 'Cadastre pelo menos um cliente em Clientes.' : ''}</p></div>
      ) : (
        <form onSubmit={submit}>
          <label>Cliente<select required name="customerId" value={form.customerId} onChange={change}><option value="">Selecione</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Produto<select required name="productId" value={form.productId} onChange={change}><option value="">Selecione</option>{products.filter((item) => Number(item.stock) > 0).map((item) => <option key={item.id} value={item.id}>{item.name} • {item.brand} • {item.stock} un.</option>)}</select></label>
          <div className="field-row"><label>Quantidade<input required name="quantity" type="number" min="1" max={product?.stock || 1} value={form.quantity} onChange={change} /></label><label>Pagamento<select name="payment" value={form.payment} onChange={change}>{PAYMENT_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label></div>
          <div className="field-row"><label>Status<select name="status" value={form.status} onChange={change}><option>Pago</option><option>A receber</option></select></label>{form.status === 'A receber' ? <label>Vencimento<input required name="dueDate" type="date" value={form.dueDate} onChange={change} /></label> : <div />}</div>
          <div className="sale-total"><span>Total da venda</span><strong>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
          <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" type="submit">Registrar venda</button></div>
        </form>
      )}
    </Modal>
  )
}
