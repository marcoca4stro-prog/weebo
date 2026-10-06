import { useState, useEffect } from 'react'
import Modal from './Modal'
import { BRAND_OPTIONS, PAYMENT_OPTIONS } from '../data'
import { Trash2 } from 'lucide-react'

export default function EditSaleModal({
  open,
  onClose,
  sale,
  onSave,
  onDelete
}) {
  const [customerName, setCustomerName] = useState('')
  const [productName, setProductName] = useState('')
  const [brand, setBrand] = useState('O Boticário')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [total, setTotal] = useState(0)
  const [payment, setPayment] = useState('PIX')
  const [installments, setInstallments] = useState(1)
  const [status, setStatus] = useState('Pago')
  const [dueDate, setDueDate] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    if (sale) {
      setCustomerName(sale.customerName || '')
      setProductName(sale.productName || '')
      setBrand(sale.brand || 'O Boticário')
      const qty = Number(sale.quantity) || 1
      setQuantity(qty)
      const uPrice = Number(sale.unitPrice) || (Number(sale.total) / qty) || 0
      setUnitPrice(uPrice)
      setTotal(Number(sale.total) || (uPrice * qty))
      setPayment(sale.payment || 'PIX')
      setInstallments(Number(sale.installments) || 1)
      setStatus(sale.status || 'Pago')
      setDueDate(sale.dueDate || '')
      setDate(sale.date || new Date().toISOString().slice(0, 10))
    }
  }, [sale, open])

  // Recalcular total se quantidade ou preço unitário mudar
  function handleQuantityChange(newQty) {
    const q = Number(newQty) || 1
    setQuantity(q)
    setTotal(Math.round(unitPrice * q * 100) / 100)
  }

  function handleUnitPriceChange(newPrice) {
    const p = Number(newPrice) || 0
    setUnitPrice(p)
    setTotal(Math.round(p * quantity * 100) / 100)
  }

  function handleTotalDirectChange(newTotal) {
    const t = Number(newTotal) || 0
    setTotal(t)
    if (quantity > 0) {
      setUnitPrice(Math.round((t / quantity) * 100) / 100)
    }
  }

  if (!sale) return null

  const installmentValue = installments > 1 ? Math.round((total / installments) * 100) / 100 : total

  function submit(event) {
    event.preventDefault()
    if (!customerName.trim()) {
      alert('Por favor, informe o nome do cliente.')
      return
    }
    if (!productName.trim()) {
      alert('Por favor, informe o nome do produto.')
      return
    }
    if (total <= 0) {
      alert('Por favor, informe um valor total válido para a venda.')
      return
    }

    const updatedSale = {
      ...sale,
      customerName: customerName.trim(),
      productName: productName.trim(),
      brand,
      quantity: Number(quantity) || 1,
      unitPrice: Number(unitPrice) || (total / (Number(quantity) || 1)),
      total: Number(total) || 0,
      payment,
      installments: Number(installments) || 1,
      installmentValue,
      status,
      dueDate: status === 'A receber' ? dueDate : '',
      date: date || sale.date
    }

    onSave(updatedSale)
    onClose()
  }

  function handleDelete() {
    if (window.confirm(`Tem certeza que deseja excluir o lançamento de "${sale.customerName}" (${sale.productName})?`)) {
      onDelete(sale.id)
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      title="Editar Lançamento"
      description="Altere o status, valor ou qualquer informação deste lançamento."
      onClose={onClose}
    >
      <form onSubmit={submit} className="sale-launch-form">
        {/* Seção Cliente */}
        <div className="form-group-card">
          <div className="form-group-header">
            <strong>Cliente</strong>
          </div>
          <label>
            Nome da cliente
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ex.: Maria Souza"
            />
          </label>
        </div>

        {/* Seção Produto e Marca */}
        <div className="form-group-card">
          <div className="form-group-header">
            <strong>Produto & Marca</strong>
          </div>
          <div className="field-row">
            <label style={{ flex: 2 }}>
              Nome do produto
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex.: Lily Eau de Parfum 75ml"
              />
            </label>
            <label style={{ flex: 1.2 }}>
              Marca
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              >
                {BRAND_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Seção Quantidade e Valores */}
        <div className="form-group-card">
          <div className="form-group-header">
            <strong>Quantidade e Valores</strong>
          </div>
          <div className="field-row">
            <label>
              Quantidade
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
              />
            </label>
            <label>
              Preço unitário (R$)
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => handleUnitPriceChange(e.target.value)}
              />
            </label>
            <label>
              Valor Total (R$)
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={total}
                onChange={(e) => handleTotalDirectChange(e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* Seção Pagamento, Parcelas e Status */}
        <div className="form-group-card">
          <div className="form-group-header">
            <strong>Pagamento & Status</strong>
          </div>
          <div className="field-row">
            <label>
              Forma de pagamento
              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
              >
                {PAYMENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Parcelamento
              <select
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
              >
                <option value={1}>À vista (1x)</option>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <option key={num} value={num}>
                    {num}x {total > 0 ? `(R$ ${(total / num).toFixed(2)})` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field-row" style={{ marginTop: 10 }}>
            <label>
              Status da venda
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  fontWeight: 'bold',
                  color: status === 'Pago' ? '#2ea86e' : '#f40675'
                }}
              >
                <option value="Pago">Pago (Recebido)</option>
                <option value="A receber">A receber (Pendente)</option>
              </select>
            </label>
            {status === 'A receber' ? (
              <label>
                Data de vencimento
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>
            ) : (
              <label>
                Data da venda
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
            )}
          </div>
        </div>

        {/* Ações do Modal */}
        <div className="modal-actions" style={{ justifyContent: 'space-between', display: 'flex' }}>
          <button
            type="button"
            className="secondary delete-action-btn"
            onClick={handleDelete}
            style={{
              color: '#d32f2f',
              borderColor: '#ffcdd2',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Trash2 size={15} />
            Excluir venda
          </button>
          <div style={{ display: 'inline-flex', gap: 10 }}>
            <button type="button" className="secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary">
              Salvar alterações
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
