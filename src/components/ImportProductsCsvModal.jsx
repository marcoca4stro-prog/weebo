import { useState, useRef } from 'react'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  Package,
  Layers
} from 'lucide-react'
import Modal from './Modal'
import { formatCurrency, makeId } from '../data'

export function parseProductsCsv(text) {
  if (!text || !text.trim()) return []

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length < 2) return []

  // Detectar delimitador (ponto-e-vírgula comum no Brasil ou vírgula)
  const firstLine = lines[0]
  const semicolonCount = (firstLine.match(/;/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length
  const delimiter = semicolonCount >= commaCount ? ';' : ','

  function parseRow(rowStr) {
    const values = []
    let current = ''
    let insideQuotes = false

    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i]
      if (char === '"') {
        insideQuotes = !insideQuotes
      } else if (char === delimiter && !insideQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''))
    return values
  }

  const rawHeaders = parseRow(lines[0]).map((h) =>
    h
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  )

  function findColIndex(...candidates) {
    return rawHeaders.findIndex((h) => candidates.some((c) => h.includes(c)))
  }

  const nameIdx = findColIndex('nome', 'produto', 'item', 'descricao', 'title')
  const brandIdx = findColIndex('marca', 'fabricante', 'brand')
  const categoryIdx = findColIndex('categoria', 'tipo', 'secao', 'grupo')
  const stockIdx = findColIndex('quantidade', 'estoque', 'qtd', 'quant', 'saldo')
  const minStockIdx = findColIndex('minimo', 'min_stock', 'estoqueminimo', 'alerta')
  const costIdx = findColIndex('custo', 'valor_custo', 'precocusto', 'compra')
  const priceIdx = findColIndex('preco', 'venda', 'valor', 'precovenda', 'unitario')

  function parseNumber(raw) {
    if (!raw) return 0
    let clean = String(raw).replace(/[R$\s]/g, '')
    // Se tiver vírgula como separador decimal (ex: 1.250,50 ou 49,90)
    if (clean.includes(',')) {
      clean = clean.replace(/\./g, '').replace(',', '.')
    }
    const num = parseFloat(clean)
    return isNaN(num) ? 0 : Math.max(0, num)
  }

  function parseBrand(raw) {
    if (!raw) return 'O Boticário'
    const lower = raw.toLowerCase()
    if (lower.includes('boticario') || lower.includes('ob')) return 'O Boticário'
    if (lower.includes('wepink') || lower.includes('pink')) return 'WePink'
    return raw.trim() || 'O Boticário'
  }

  const products = []

  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i])
    if (row.length === 0 || row.every((c) => !c)) continue

    const name = nameIdx !== -1 ? row[nameIdx] : row[0]
    if (!name) continue

    const brand = brandIdx !== -1 ? parseBrand(row[brandIdx]) : 'O Boticário'
    const category = categoryIdx !== -1 ? row[categoryIdx] : 'Cosméticos'
    const stock = stockIdx !== -1 ? Math.round(parseNumber(row[stockIdx])) : 1
    const minStock = minStockIdx !== -1 ? Math.round(parseNumber(row[minStockIdx])) : 2
    const cost = costIdx !== -1 ? parseNumber(row[costIdx]) : 0
    const price = priceIdx !== -1 ? parseNumber(row[priceIdx]) : 0

    products.push({
      id: makeId(),
      name: name.trim(),
      brand,
      category: category ? category.trim() : 'Geral',
      stock,
      minStock,
      cost,
      price
    })
  }

  return products
}

export default function ImportProductsCsvModal({ open, onClose, onImport }) {
  const [file, setFile] = useState(null)
  const [parsed, setParsed] = useState([])
  const [error, setError] = useState('')
  const [replaceMode, setReplaceMode] = useState(false)
  const fileInputRef = useRef(null)

  function handleFileChange(e) {
    const selected = e.target.files?.[0]
    if (!selected) return
    processFile(selected)
  }

  function processFile(selectedFile) {
    setFile(selectedFile)
    setError('')
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result
        const items = parseProductsCsv(text)
        if (items.length === 0) {
          setError('Nenhum produto válido encontrado no arquivo. Verifique o cabeçalho e tente novamente.')
          setParsed([])
        } else {
          setParsed(items)
        }
      } catch (err) {
        setError('Erro ao processar arquivo CSV: ' + err.message)
        setParsed([])
      }
    }
    reader.onerror = () => {
      setError('Erro na leitura do arquivo.')
    }
    reader.readAsText(selectedFile, 'UTF-8')
  }

  function handleConfirm() {
    if (parsed.length === 0) return
    onImport(parsed, replaceMode)
    handleClose()
  }

  function handleClose() {
    setFile(null)
    setParsed([])
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  function downloadSampleCsv() {
    const sample = `Nome do Produto;Marca;Categoria;Quantidade;Custo;Preco;Estoque Minimo
Body Splash VF Melancia;WePink;Perfumaria;10;35,00;79,90;2
Malbec Desodorante Colonia 100ml;O Boticário;Perfumaria;8;85,00;199,90;3
Creme Acetinado Lily 250g;O Boticário;Corpo e Banho;5;55,00;129,90;2
Serum Facial Rosa Mosqueta;WePink;Tratamento;12;29,90;69,90;4`

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modelo_produtos_weebo.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      title="Importar Produtos por CSV"
      description="Carregue sua planilha de cosméticos para cadastrar em lote."
      onClose={handleClose}
    >
      <div className="import-csv-sheet">
        {/* Caixa de Upload Drag & Drop */}
        <div
          className={`csv-dropzone ${file ? 'has-file' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,application/vnd.ms-excel"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div className="dropzone-icon">
            <FileSpreadsheet size={36} />
          </div>
          <div className="dropzone-text">
            <strong>{file ? file.name : 'Clique para selecionar seu arquivo .CSV'}</strong>
            <p>Aceita formato separado por vírgula (,) ou ponto-e-vírgula (;)</p>
          </div>
          <span className="dropzone-btn">
            <Upload size={15} />
            {file ? 'Trocar arquivo' : 'Selecionar arquivo'}
          </span>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="import-error-banner">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        {/* Pré-visualização dos Itens Identificados */}
        {parsed.length > 0 && (
          <div className="import-preview-box">
            <div className="import-preview-header">
              <div className="preview-count-badge">
                <CheckCircle2 size={16} />
                <span><b>{parsed.length}</b> produtos encontrados</span>
              </div>
              <label className="import-replace-checkbox">
                <input
                  type="checkbox"
                  checked={replaceMode}
                  onChange={(e) => setReplaceMode(e.target.checked)}
                />
                <span>Substituir estoque atual (em vez de somar)</span>
              </label>
            </div>

            <div className="import-preview-table-wrap">
              <table className="import-preview-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Marca</th>
                    <th>Qtd</th>
                    <th>Custo</th>
                    <th>Venda</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 5).map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.name}</strong></td>
                      <td>
                        <span className={`brand-mark ${item.brand === 'WePink' ? 'wp' : 'ob'}`}>
                          {item.brand}
                        </span>
                      </td>
                      <td>{item.stock} un.</td>
                      <td>{formatCurrency(item.cost)}</td>
                      <td>{formatCurrency(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.length > 5 && (
                <div className="preview-more-hint">
                  + {parsed.length - 5} outros produtos serão importados
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rodapé com Download do Modelo e Ações */}
        <div className="import-sheet-footer">
          <button type="button" className="download-template-btn" onClick={downloadSampleCsv}>
            <Download size={14} />
            <span>Baixar planilha modelo</span>
          </button>

          <div className="modal-actions-inline">
            <button type="button" className="secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="primary"
              disabled={parsed.length === 0}
              onClick={handleConfirm}
            >
              <Package size={16} />
              <span>Importar {parsed.length > 0 ? `${parsed.length} produtos` : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
