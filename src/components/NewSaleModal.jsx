import { useMemo, useState } from 'react'
import Modal from './Modal'
import { BRAND_OPTIONS, PAYMENT_OPTIONS, makeId } from '../data'

export default function NewSaleModal({
  open,
  onClose,
  onSave,
  products,
  customers,
  allowOutOfStock = false
}) {
  const [isNewCustomer, setIsNewCustomer] = useState(customers.length === 0)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')

  const [isNewProduct, setIsNewProduct] = useState(products.length === 0)
  const [newProductName, setNewProductName] = useState('')
  const [newProductBrand, setNewProductBrand] = useState('O Boticário')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [newProductCost, setNewProductCost] = useState('')

  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '')
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '')
  const [quantity, setQuantity] = useState(1)
  const [payment, setPayment] = useState('PIX')
  const [installments, setInstallments] = useState(1)
  const [status, setStatus] = useState('Pago')
  const [dueDate, setDueDate] = useState('')

  // Produto selecionado (se existente)
  const existingProduct = useMemo(
    () => products.find((item) => item.id === selectedProductId),
    [products, selectedProductId]
  )

  // Preço unitário
  const unitPrice = isNewProduct
    ? Number(newProductPrice) || 0
    : Number(existingProduct?.price) || 0

  const total = unitPrice * (Number(quantity) || 0)
  const installmentValue = installments > 1 ? total / installments : total

  function resetForm() {
    setIsNewCustomer(customers.length === 0)
    setNewCustomerName('')
    setNewCustomerPhone('')
    setIsNewProduct(products.length === 0)
    setNewProductName('')
    setNewProductBrand('O Boticário')
    setNewProductPrice('')
    setNewProductCost('')
    setSelectedCustomerId(customers[0]?.id || '')
    setSelectedProductId(products[0]?.id || '')
    setQuantity(1)
    setPayment('PIX')
    setInstallments(1)
    setStatus('Pago')
    setDueDate('')
  }

  function submit(event) {
    event.preventDefault()

    let customerId = selectedCustomerId
    let customerName = ''
    let newCustomerObj = null

    if (isNewCustomer || customers.length === 0) {
      if (!newCustomerName.trim()) {
        alert('Por favor, informe o nome do cliente.')
        return
      }
      customerId = makeId()
      customerName = newCustomerName.trim()
      newCustomerObj = {
        id: customerId,
        name: customerName,
        phone: newCustomerPhone.trim() || '—',
        email: '—',
        totalSpent: total,
        lastOrder: new Date().toISOString().slice(0, 10)
      }
    } else {
      const found = customers.find((c) => c.id === customerId) || customers[0]
      if (!found) {
        alert('Selecione um cliente válido ou adicione um novo.')
        return
      }
      customerId = found.id
      customerName = found.name
    }

    let productId = selectedProductId
    let productName = ''
    let productBrand = ''
    let unitCost = 0
    let newProductObj = null

    if (isNewProduct || products.length === 0) {
      if (!newProductName.trim()) {
        alert('Por favor, informe o nome do produto.')
        return
      }
      if (unitPrice <= 0) {
        alert('Por favor, informe o preço de venda do produto.')
        return
      }
      productId = makeId()
      productName = newProductName.trim()
      productBrand = newProductBrand
      unitCost = Number(newProductCost) || Math.round(unitPrice * 0.65)
      // Produto adicionado via lançamento de venda entra no estoque ZERADO (0)
      newProductObj = {
        id: productId,
        name: productName,
        brand: productBrand,
        category: 'Cosméticos',
        price: unitPrice,
        cost: unitCost,
        stock: 0
      }
    } else {
      const prod = existingProduct || products[0]
      if (!prod) {
        alert('Selecione um produto ou marque para cadastrar um novo.')
        return
      }
      productId = prod.id
      productName = prod.name
      productBrand = prod.brand
      unitCost = Number(prod.cost) || 0
    }

    const sale = {
      id: makeId(),
      date: new Date().toISOString().slice(0, 10),
      customerId,
      customerName,
      productId,
      productName,
      brand: productBrand,
      quantity: Number(quantity) || 1,
      unitPrice,
      unitCost,
      total,
      payment,
      installments: Number(installments) || 1,
      installmentValue,
      status,
      dueDate: status === 'A receber' ? dueDate : ''
    }

    onSave({ sale, newProduct: newProductObj, newCustomer: newCustomerObj })
    resetForm()
    onClose()
  }

  return (
    <Modal
      open={open}
      title="Novo Lançamento de Venda"
      description="Registre vendas diretamente. Produtos novos ou esgotados são salvos no estoque com quantidade zerada."
      onClose={onClose}
    >
      <form onSubmit={submit} className="sale-launch-form">
        {/* Seção Cliente */}
        <div className="form-group-card">
          <div className="form-group-header">
            <strong>Cliente</strong>
            {customers.length > 0 && (
              <button
                type="button"
                className="toggle-link-btn"
                onClick={() => setIsNewCustomer((v) => !v)}
              >
                {isNewCustomer ? 'Selecionar cadastrado' : '+ Digitar novo cliente'}
              </button>
            )}
          </div>

          {isNewCustomer || customers.length === 0 ? (
            <div className="field-row">
              <label>
                Nome do cliente *
                <input
                  required
                  placeholder="Ex: Ana Paula"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                />
              </label>
              <label>
                Telefone (opcional)
                <input
                  placeholder="(00) 00000-0000"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                />
              </label>
            </div>
          ) : (
            <label>
              Selecione o cliente *
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Selecione um cliente</option>
                {customers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* Seção Produto */}
        <div className="form-group-card">
          <div className="form-group-header">
            <strong>Produto</strong>
            {products.length > 0 && (
              <button
                type="button"
                className="toggle-link-btn"
                onClick={() => setIsNewProduct((v) => !v)}
              >
                {isNewProduct ? 'Selecionar do estoque' : '+ Lançar novo produto'}
              </button>
            )}
          </div>

          {isNewProduct || products.length === 0 ? (
            <>
              <div className="field-row">
                <label>
                  Nome do produto *
                  <input
                    required
                    placeholder="Ex: Batom Matte / Perfume Lily"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                  />
                </label>
                <label>
                  Marca *
                  <select
                    value={newProductBrand}
                    onChange={(e) => setNewProductBrand(e.target.value)}
                  >
                    {BRAND_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="field-row">
                <label>
                  Preço de venda (R$) *
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                  />
                </label>
                <label>
                  Custo (R$, opcional)
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={newProductCost}
                    onChange={(e) => setNewProductCost(e.target.value)}
                  />
                </label>
              </div>
              <div className="stock-zero-badge">
                <span>ℹ</span> Este item entrará no seu estoque como <b>zerado (0 un.)</b>, pois já foi vendido.
              </div>
            </>
          ) : (
            <>
              <label>
                Selecione o produto *
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">Selecione um produto</option>
                  {products.map((item) => {
                    const isOutOfStock = Number(item.stock) <= 0
                    return (
                      <option key={item.id} value={item.id}>
                        {item.name} • {item.brand} • {Number(item.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        {isOutOfStock ? ' (Esgotado - estoque zerado)' : ` (${item.stock} un.)`}
                      </option>
                    )
                  })}
                </select>
              </label>
              {existingProduct && Number(existingProduct.stock) <= 0 && (
                <div className="stock-zero-badge warning">
                  <span>ℹ</span> Produto esgotado. Ao confirmar o lançamento, o estoque permanecerá <b>zerado (0 un.)</b>.
                </div>
              )}
            </>
          )}
        </div>

        {/* Quantidade */}
        <div className="field-row">
          <label>
            Quantidade *
            <input
              required
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </label>
          <label>
            Forma de pagamento
            <select value={payment} onChange={(e) => setPayment(e.target.value)}>
              {PAYMENT_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Parcelamento do Valor Total */}
        <div className="field-row">
          <label>
            Parcelamento
            <select
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
            >
              <option value={1}>À vista (1x)</option>
              {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                const val = total > 0 ? total / num : 0
                return (
                  <option key={num} value={num}>
                    {num}x de {val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </option>
                )
              })}
            </select>
          </label>

          <label>
            Status do pagamento
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Pago">Pago</option>
              <option value="A receber">A receber</option>
            </select>
          </label>
        </div>

        {/* Vencimento (quando a receber) */}
        {status === 'A receber' && (
          <label>
            Data de vencimento {installments > 1 ? '(1ª parcela)' : ''} *
            <input
              required
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
        )}

        {/* Total do lançamento com detalhe das parcelas */}
        <div className="sale-total">
          <div>
            <span>Total do lançamento</span>
            {installments > 1 && total > 0 && (
              <small style={{ display: 'block', color: 'var(--theme-primary)', fontWeight: 700, fontSize: '12px', marginTop: 3 }}>
                {installments}x de {installmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </small>
            )}
          </div>
          <strong>
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </strong>
        </div>

        {/* Ações / Botão Adicionar sempre visível */}
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary" type="submit">
            Adicionar Lançamento
          </button>
        </div>
      </form>
    </Modal>
  )
}
