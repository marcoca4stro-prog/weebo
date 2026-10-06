import { useMemo, useState, useEffect } from 'react'
import Modal from './Modal'
import { BRAND_OPTIONS, PAYMENT_OPTIONS, formatCurrency, makeId } from '../data'
import { generateInstallmentsList } from '../utils/installments'
import { Plus, Trash2, ShoppingCart, PackagePlus, AlertCircle } from 'lucide-react'

export default function NewSaleModal({
  open,
  onClose,
  onSave,
  products,
  customers,
  allowOutOfStock = false,
  initialCustomerId = ''
}) {
  // Cliente
  const [isNewCustomer, setIsNewCustomer] = useState(customers.length === 0)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || customers[0]?.id || '')

  // Lista de itens do pedido (carrinho)
  const [items, setItems] = useState([])

  // Formulário de adição de item atual
  const [itemMode, setItemMode] = useState(products.length === 0 ? 'new' : 'existing') // 'existing' | 'new'
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemCustomPrice, setItemCustomPrice] = useState('')

  // Para novo produto digitado na hora
  const [newProdName, setNewProdName] = useState('')
  const [newProdBrand, setNewProdBrand] = useState('O Boticário')
  const [newProdPrice, setNewProdPrice] = useState('')
  const [newProdCost, setNewProdCost] = useState('')

  // Pagamento e Parcelas
  const [payment, setPayment] = useState('PIX')
  const [installments, setInstallments] = useState(1)
  const [status, setStatus] = useState('Pago')
  const [dueDate, setDueDate] = useState('')

  // Quando abre o modal ou muda initialCustomerId
  useEffect(() => {
    if (open) {
      if (initialCustomerId) {
        setSelectedCustomerId(initialCustomerId)
        setIsNewCustomer(false)
      } else if (customers.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(customers[0].id)
      }

      if (products.length > 0 && !selectedProductId) {
        setSelectedProductId(products[0].id)
        setItemCustomPrice(String(products[0].price || ''))
      }
    }
  }, [open, initialCustomerId, customers, products])

  // Atualiza preço sugerido quando seleciona produto existente
  const currentCatalogProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  )

  useEffect(() => {
    if (currentCatalogProduct && itemMode === 'existing') {
      setItemCustomPrice(String(currentCatalogProduct.price || ''))
    }
  }, [selectedProductId, itemMode, currentCatalogProduct])

  // Total acumulado de todos os itens já adicionados ao pedido
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
  }, [items])

  const installmentValue = installments > 1 && total > 0 ? total / installments : total

  function resetForm() {
    setIsNewCustomer(customers.length === 0)
    setNewCustomerName('')
    setNewCustomerPhone('')
    setSelectedCustomerId(customers[0]?.id || '')
    setItems([])
    setItemMode(products.length === 0 ? 'new' : 'existing')
    setSelectedProductId(products[0]?.id || '')
    setItemQuantity(1)
    setItemCustomPrice(products[0]?.price ? String(products[0].price) : '')
    setNewProdName('')
    setNewProdBrand('O Boticário')
    setNewProdPrice('')
    setNewProdCost('')
    setPayment('PIX')
    setInstallments(1)
    setStatus('Pago')
    setDueDate('')
  }

  // Adiciona o produto preenchido à lista de itens
  function handleAddItem() {
    const qty = Math.max(1, Number(itemQuantity) || 1)

    if (itemMode === 'existing') {
      const prod = currentCatalogProduct || products[0]
      if (!prod) {
        alert('Selecione um produto do catálogo ou cadastre um novo.')
        return
      }

      const unitP = Number(itemCustomPrice) > 0 ? Number(itemCustomPrice) : Number(prod.price) || 0
      const subtotal = Math.round(unitP * qty * 100) / 100

      const newItem = {
        id: makeId(),
        productId: prod.id,
        productName: prod.name,
        brand: prod.brand,
        quantity: qty,
        unitPrice: unitP,
        unitCost: Number(prod.cost) || 0,
        total: subtotal,
        isNewProduct: false
      }

      setItems((prev) => [...prev, newItem])
      setItemQuantity(1)
    } else {
      // Produto novo digitado na hora
      if (!newProdName.trim()) {
        alert('Por favor, digite o nome do produto.')
        return
      }
      const unitP = Number(newProdPrice)
      if (!unitP || unitP <= 0) {
        alert('Por favor, informe o preço de venda do produto.')
        return
      }

      const unitC = Number(newProdCost) || Math.round(unitP * 0.65)
      const subtotal = Math.round(unitP * qty * 100) / 100

      const newItem = {
        id: makeId(),
        productId: makeId(),
        productName: newProdName.trim(),
        brand: newProdBrand,
        quantity: qty,
        unitPrice: unitP,
        unitCost: unitC,
        total: subtotal,
        isNewProduct: true
      }

      setItems((prev) => [...prev, newItem])
      setNewProdName('')
      setNewProdPrice('')
      setNewProdCost('')
      setItemQuantity(1)
    }
  }

  function handleRemoveItem(itemId) {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  function handleUpdateItemQty(itemId, newQty) {
    const q = Math.max(1, Number(newQty) || 1)
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: q,
            total: Math.round(item.unitPrice * q * 100) / 100
          }
        }
        return item
      })
    )
  }

  function submit(event) {
    event.preventDefault()

    // Validação do Cliente
    let customerId = selectedCustomerId
    let customerName = ''
    let newCustomerObj = null

    if (isNewCustomer || customers.length === 0) {
      if (!newCustomerName.trim()) {
        alert('Por favor, informe o nome da cliente.')
        return
      }
      customerId = makeId()
      customerName = newCustomerName.trim()
      newCustomerObj = {
        id: customerId,
        name: customerName,
        phone: newCustomerPhone.trim() || '—',
        email: '—',
        totalSpent: 0,
        lastOrder: new Date().toISOString().slice(0, 10)
      }
    } else {
      const found = customers.find((c) => c.id === customerId) || customers[0]
      if (!found) {
        alert('Selecione uma cliente válida ou cadastre uma nova.')
        return
      }
      customerId = found.id
      customerName = found.name
    }

    // Se o usuário não clicou em "Adicionar item" ainda, mas preencheu o formulário do item:
    let finalItems = [...items]
    if (finalItems.length === 0) {
      if (itemMode === 'existing' && currentCatalogProduct) {
        const qty = Math.max(1, Number(itemQuantity) || 1)
        const unitP = Number(itemCustomPrice) > 0 ? Number(itemCustomPrice) : Number(currentCatalogProduct.price) || 0
        finalItems.push({
          id: makeId(),
          productId: currentCatalogProduct.id,
          productName: currentCatalogProduct.name,
          brand: currentCatalogProduct.brand,
          quantity: qty,
          unitPrice: unitP,
          unitCost: Number(currentCatalogProduct.cost) || 0,
          total: Math.round(unitP * qty * 100) / 100,
          isNewProduct: false
        })
      } else if (itemMode === 'new' && newProdName.trim()) {
        const qty = Math.max(1, Number(itemQuantity) || 1)
        const unitP = Number(newProdPrice) || 0
        if (unitP <= 0) {
          alert('Por favor, informe o preço do produto.')
          return
        }
        const unitC = Number(newProdCost) || Math.round(unitP * 0.65)
        finalItems.push({
          id: makeId(),
          productId: makeId(),
          productName: newProdName.trim(),
          brand: newProdBrand,
          quantity: qty,
          unitPrice: unitP,
          unitCost: unitC,
          total: Math.round(unitP * qty * 100) / 100,
          isNewProduct: true
        })
      } else {
        alert('Adicione pelo menos um produto ao pedido antes de salvar.')
        return
      }
    }

    const saleTotal = finalItems.reduce((sum, it) => sum + (Number(it.total) || 0), 0)
    if (saleTotal <= 0) {
      alert('O valor total da venda precisa ser maior que zero.')
      return
    }

    if (status === 'A receber' && !dueDate) {
      alert('Por favor, informe a data de vencimento da 1ª parcela.')
      return
    }

    // Preparar lista de novos produtos para cadastrar no catálogo (com estoque zerado)
    const newProductsToRegister = finalItems
      .filter((it) => it.isNewProduct)
      .map((it) => ({
        id: it.productId,
        name: it.productName,
        brand: it.brand,
        category: 'Cosméticos',
        price: it.unitPrice,
        cost: it.unitCost,
        stock: 0
      }))

    // Preparar resumo dos nomes e marcas
    const uniqueBrands = [...new Set(finalItems.map((it) => it.brand))]
    const mainBrand = uniqueBrands.length === 1 ? uniqueBrands[0] : 'WePink / O Boticário'

    let summaryProductName = ''
    if (finalItems.length === 1) {
      summaryProductName = finalItems[0].productName
    } else {
      const first = finalItems[0].productName
      const remainingCount = finalItems.length - 1
      summaryProductName = `${first} + ${remainingCount} ${remainingCount === 1 ? 'item' : 'itens'}`
    }

    const totalQty = finalItems.reduce((sum, it) => sum + it.quantity, 0)
    const totalCost = finalItems.reduce((sum, it) => sum + (it.unitCost * it.quantity), 0)
    const today = new Date().toISOString().slice(0, 10)

    // Gerar lista estruturada de parcelas
    const installmentsCount = Number(installments) || 1
    const installmentsList = generateInstallmentsList({
      total: saleTotal,
      installmentsCount,
      firstDueDate: dueDate,
      saleDate: today,
      status
    })

    const newSale = {
      id: makeId(),
      date: today,
      customerId,
      customerName,
      items: finalItems,
      productId: finalItems[0]?.productId || '',
      productName: summaryProductName,
      brand: mainBrand,
      quantity: totalQty,
      unitPrice: Math.round((saleTotal / totalQty) * 100) / 100,
      unitCost: Math.round((totalCost / totalQty) * 100) / 100,
      total: saleTotal,
      payment,
      installments: installmentsCount,
      installmentValue: installmentsCount > 1 ? saleTotal / installmentsCount : saleTotal,
      installmentsList,
      paidAmount: status === 'Pago' ? saleTotal : 0,
      remainingAmount: status === 'Pago' ? 0 : saleTotal,
      status,
      dueDate: status === 'A receber' ? dueDate : ''
    }

    // Salva a venda passando múltiplos itens e produtos
    onSave({
      sale: newSale,
      newProducts: newProductsToRegister,
      newProduct: newProductsToRegister[0] || null,
      newCustomer: newCustomerObj,
      items: finalItems
    })

    resetForm()
    onClose()
  }

  return (
    <Modal
      open={open}
      title="Novo Lançamento de Venda"
      description="Lance pedidos com um ou vários produtos ao mesmo tempo para a mesma cliente."
      onClose={onClose}
    >
      <form onSubmit={submit} className="sale-launch-form">
        {/* SEÇÃO 1: CLIENTE */}
        <div className="form-group-card">
          <div className="form-group-header">
            <strong>1. Cliente</strong>
            {customers.length > 0 && (
              <button
                type="button"
                className="toggle-link-btn"
                onClick={() => setIsNewCustomer((v) => !v)}
              >
                {isNewCustomer ? 'Selecionar cadastrada' : '+ Digitar nova cliente'}
              </button>
            )}
          </div>

          {isNewCustomer || customers.length === 0 ? (
            <div className="field-row">
              <label>
                Nome da cliente *
                <input
                  required
                  placeholder="Ex: Mariana Silva"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                />
              </label>
              <label>
                Telefone (WhatsApp)
                <input
                  placeholder="(00) 00000-0000"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                />
              </label>
            </div>
          ) : (
            <label>
              Selecione a cliente *
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Selecione uma cliente</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone && c.phone !== '—' ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* SEÇÃO 2: PRODUTOS DA VENDA (CARRINHO MULTI-PRODUTOS) */}
        <div className="form-group-card multi-prod-card">
          <div className="form-group-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShoppingCart size={16} color="var(--theme-primary)" />
              <strong>2. Produtos do Pedido</strong>
            </div>
            {items.length > 0 && (
              <span className="items-count-badge">
                {items.length} {items.length === 1 ? 'produto adicionado' : 'produtos adicionados'}
              </span>
            )}
          </div>

          {/* Lista de itens já adicionados */}
          {items.length > 0 && (
            <div className="added-items-container">
              <div className="added-items-list">
                {items.map((it, idx) => (
                  <div key={it.id || idx} className="added-item-row">
                    <div className="added-item-info">
                      <strong>{it.productName}</strong>
                      <span className="added-item-meta">
                        <span className={`brand-mark ${it.brand === 'WePink' ? 'wp' : 'ob'}`}>
                          {it.brand}
                        </span>
                        <span>{formatCurrency(it.unitPrice)} un.</span>
                      </span>
                    </div>

                    <div className="added-item-actions">
                      <div className="item-qty-control">
                        <label>Qtd:</label>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleUpdateItemQty(it.id, e.target.value)}
                        />
                      </div>

                      <strong className="added-item-subtotal">
                        {formatCurrency(it.total)}
                      </strong>

                      <button
                        type="button"
                        className="item-remove-btn"
                        onClick={() => handleRemoveItem(it.id)}
                        title="Remover produto do pedido"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Área para Adicionar Mais Produtos */}
          <div className="add-item-box">
            <div className="add-item-box-header">
              <span className="add-item-box-title">
                {items.length === 0 ? 'Adicionar primeiro produto:' : '+ Incluir outro produto neste pedido:'}
              </span>
              {products.length > 0 && (
                <div className="mode-pill-toggle">
                  <button
                    type="button"
                    className={`mode-btn ${itemMode === 'existing' ? 'active' : ''}`}
                    onClick={() => setItemMode('existing')}
                  >
                    Do estoque
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${itemMode === 'new' ? 'active' : ''}`}
                    onClick={() => setItemMode('new')}
                  >
                    Novo produto
                  </button>
                </div>
              )}
            </div>

            {itemMode === 'existing' && products.length > 0 ? (
              <>
                <label>
                  Produto *
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((item) => {
                      const isOutOfStock = Number(item.stock) <= 0
                      return (
                        <option key={item.id} value={item.id}>
                          {item.name} • {item.brand} • {formatCurrency(item.price)}
                          {isOutOfStock ? ' (Esgotado)' : ` (${item.stock} un.)`}
                        </option>
                      )
                    })}
                  </select>
                </label>

                <div className="field-row" style={{ marginTop: 8 }}>
                  <label>
                    Preço de venda (R$)
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={itemCustomPrice}
                      onChange={(e) => setItemCustomPrice(e.target.value)}
                    />
                  </label>
                  <label>
                    Quantidade
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="field-row">
                  <label>
                    Nome do produto *
                    <input
                      placeholder="Ex: Body Splash / Sérum 10 em 1"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                    />
                  </label>
                  <label>
                    Marca *
                    <select
                      value={newProdBrand}
                      onChange={(e) => setNewProdBrand(e.target.value)}
                    >
                      {BRAND_OPTIONS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="field-row" style={{ marginTop: 8 }}>
                  <label>
                    Preço de venda (R$) *
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                    />
                  </label>
                  <label>
                    Quantidade *
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </label>
                </div>
              </>
            )}

            <button
              type="button"
              className="add-to-cart-btn"
              onClick={handleAddItem}
            >
              <Plus size={15} />
              {items.length === 0 ? 'Adicionar produto ao pedido' : 'Adicionar este produto à lista'}
            </button>
          </div>
        </div>

        {/* SEÇÃO 3: FORMA DE PAGAMENTO & PARCELAMENTO */}
        <div className="form-group-card">
          <div className="form-group-header">
            <strong>3. Pagamento e Parcelas</strong>
          </div>

          <div className="field-row">
            <label>
              Forma de pagamento
              <select value={payment} onChange={(e) => setPayment(e.target.value)}>
                {PAYMENT_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
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
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                  const val = total > 0 ? total / num : 0
                  return (
                    <option key={num} value={num}>
                      {num}x de {formatCurrency(val)}
                    </option>
                  )
                })}
              </select>
            </label>
          </div>

          <div className="field-row" style={{ marginTop: 8 }}>
            <label>
              Status do recebimento
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Pago">Pago (Recebido agora)</option>
                <option value="A receber">A receber (Parcelado / Fiado)</option>
              </select>
            </label>

            {status === 'A receber' && (
              <label>
                Vencimento da 1ª parcela *
                <input
                  required
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>
            )}
          </div>
        </div>

        {/* TOTAL DA VENDA & PARCELAS */}
        <div className="sale-total">
          <div>
            <span>Total da Venda ({items.length || (currentCatalogProduct || newProdName ? 1 : 0)} produtos)</span>
            {installments > 1 && total > 0 && (
              <small style={{ display: 'block', color: 'var(--theme-primary)', fontWeight: 700, fontSize: '13px', marginTop: 3 }}>
                {installments}x de {formatCurrency(installmentValue)}
              </small>
            )}
          </div>
          <strong>
            {formatCurrency(total || (Number(itemCustomPrice || newProdPrice) * itemQuantity) || 0)}
          </strong>
        </div>

        {/* AÇÕES */}
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary" type="submit">
            Confirmar Lançamento
          </button>
        </div>
      </form>
    </Modal>
  )
}
