import { useState } from 'react'
import {
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RotateCcw,
  SlidersHorizontal,
  Check,
  X,
  GripVertical
} from 'lucide-react'
import Modal from './Modal'

export const DEFAULT_OVERVIEW_SECTIONS = [
  { id: 'brandFilter', label: 'Filtro por Marcas', description: 'Seleção entre Todas as marcas, O Boticário e WePink', visible: true },
  { id: 'metrics', label: 'Indicadores do Negócio (Métricas 2×2)', description: 'Vendas, Lucro Estimado, A Receber e Estoque baixo', visible: true },
  { id: 'salesChart', label: 'Gráfico Comparativo de Vendas', description: 'Barras mensais com comparativo por marca', visible: true },
  { id: 'recentSales', label: 'Últimas Vendas Registradas', description: 'Tabela dos lançamentos mais recentes com ações rápidas', visible: true },
  { id: 'topProducts', label: 'Produtos Mais Vendidos', description: 'Ranking com os itens de maior saída e faturamento', visible: true },
  { id: 'receivables', label: 'Painel A Receber', description: 'Lista dos clientes com pagamentos pendentes', visible: true },
  { id: 'lowStock', label: 'Alerta de Estoque Baixo', description: 'Itens no limite mínimo precisando de reposição', visible: true }
]

export default function CustomizeOverviewModal({
  open,
  onClose,
  sections = DEFAULT_OVERVIEW_SECTIONS,
  onSave
}) {
  const [current, setCurrent] = useState(sections)

  function moveUp(index) {
    if (index === 0) return
    const updated = [...current]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    setCurrent(updated)
  }

  function moveDown(index) {
    if (index === current.length - 1) return
    const updated = [...current]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
    setCurrent(updated)
  }

  function toggleVisibility(id) {
    setCurrent((prev) =>
      prev.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item))
    )
  }

  function handleReset() {
    setCurrent(DEFAULT_OVERVIEW_SECTIONS)
  }

  function handleConfirm() {
    onSave(current)
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      title="Personalizar Visão Geral"
      description="Ative, oculte e alterne a ordem das seções como preferir."
      onClose={onClose}
    >
      <div className="customize-overview-sheet">
        <div className="customize-sections-list">
          {current.map((item, index) => (
            <div
              key={item.id}
              className={`customize-section-card ${!item.visible ? 'is-hidden' : ''}`}
            >
              <div className="customize-section-left">
                <div className="customize-drag-indicator">
                  <span className="order-number">{index + 1}º</span>
                </div>
                <div className="customize-section-text">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </div>
              </div>

              <div className="customize-section-controls">
                {/* Botões de Mover para Cima e Baixo */}
                <div className="reorder-btn-group">
                  <button
                    type="button"
                    className="reorder-btn"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    title="Mover para cima"
                    aria-label="Mover para cima"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    className="reorder-btn"
                    onClick={() => moveDown(index)}
                    disabled={index === current.length - 1}
                    title="Mover para baixo"
                    aria-label="Mover para baixo"
                  >
                    <ArrowDown size={15} />
                  </button>
                </div>

                {/* Botão de Visibilidade (Ativar / Desativar) */}
                <button
                  type="button"
                  className={`visibility-toggle-btn ${item.visible ? 'visible' : 'hidden'}`}
                  onClick={() => toggleVisibility(item.id)}
                  title={item.visible ? 'Clique para ocultar' : 'Clique para exibir'}
                  aria-label={item.visible ? 'Ocultar seção' : 'Exibir seção'}
                >
                  {item.visible ? (
                    <>
                      <Eye size={15} />
                      <span>Visível</span>
                    </>
                  ) : (
                    <>
                      <EyeOff size={15} />
                      <span>Oculto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="customize-sheet-actions">
          <button type="button" className="subtle-btn" onClick={handleReset}>
            <RotateCcw size={15} />
            <span>Restaurar padrão</span>
          </button>

          <div className="primary-actions-group">
            <button type="button" className="ghost-btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="primary" onClick={handleConfirm}>
              <Check size={16} />
              <span>Salvar preferências</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
