import { useState, useRef } from 'react'
import { Bell, Camera, Check, Clock, Moon, RefreshCw, Settings, ShieldCheck, Smartphone, Sun, User } from 'lucide-react'

export default function SettingsPage({
  darkMode,
  setDarkMode,
  userAvatar,
  setUserAvatar,
  allowOutOfStock,
  setAllowOutOfStock,
  notificationLeadTime = '1_day',
  setNotificationLeadTime
}) {
  const fileInputRef = useRef(null)
  const [successMessage, setSuccessMessage] = useState('')

  function notify(msg) {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, etc).')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        setUserAvatar(result)
        notify('Foto de perfil atualizada com sucesso!')
      }
    }
    reader.readAsDataURL(file)
  }

  function handleResetPhoto() {
    setUserAvatar('/bianca.png')
    notify('Foto original restaurada com sucesso!')
  }

  function requestIPhoneNotifications() {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Weebo Cosméticos', {
            body: 'Notificações ativadas para o seu iPhone!',
            icon: '/logo.png'
          })
          notify('Notificações autorizadas com sucesso!')
        } else {
          notify('Permissão para notificações não foi concedida no navegador.')
        }
      })
    } else {
      notify('Notificações em tela (banners e avisos) já estão 100% ativas!')
    }
  }

  return (
    <div className="settings-page">
      <div className="section-header">
        <div>
          <h2>Configurações</h2>
          <p>Personalize sua experiência, notificações e regras do negócio.</p>
        </div>
      </div>

      {successMessage && (
        <div className="settings-toast" role="alert">
          <span>✓</span> {successMessage}
        </div>
      )}

      <div className="settings-grid">
        {/* Card 1: Modo Escuro */}
        <section className="panel settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-badge">
              {darkMode ? <Moon size={22} /> : <Sun size={22} />}
            </div>
            <div>
              <h3>Aparência e Modo Escuro</h3>
              <p>Alterne entre os modos claro e escuro para melhor conforto visual.</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="settings-option-row">
              <div>
                <strong>Modo Escuro (Dark Mode)</strong>
                <small>
                  {darkMode ? 'Tema escuro ativado atualmente.' : 'Tema claro ativo no momento.'}
                </small>
              </div>
              <label className="switch" aria-label="Alternar modo escuro">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => {
                    setDarkMode(e.target.checked)
                    notify(e.target.checked ? 'Modo escuro ativado!' : 'Modo claro ativado!')
                  }}
                />
                <span className="slider round" />
              </label>
            </div>
          </div>
        </section>

        {/* Card 2: Foto do Usuário */}
        <section className="panel settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-badge">
              <Camera size={22} />
            </div>
            <div>
              <h3>Foto do Usuário</h3>
              <p>Personalize sua foto exibida na barra lateral e no cabeçalho.</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="avatar-edit-container">
              <div className="avatar-edit-preview">
                <img src={userAvatar || '/bianca.png'} alt="Foto de perfil" />
              </div>
              <div className="avatar-edit-details">
                <strong>Bianca Alves</strong>
                <small>Revendedora independente</small>

                <div className="avatar-actions">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Alterar foto
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={handleResetPhoto}
                    title="Restaurar para a foto padrão enviada"
                  >
                    <RefreshCw size={14} style={{ marginRight: 5 }} />
                    Restaurar original
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Card 3: Notificações de Pagamentos Próximos (Compatível com iPhone) */}
        <section className="panel settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-badge">
              <Bell size={22} />
            </div>
            <div>
              <h3>Avisos de Pagamentos a Receber</h3>
              <p>Configure a antecedência dos avisos de cobrança e lembretes para iPhone.</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div>
              <strong>Antecedência dos avisos de pagamento</strong>
              <small>Escolha com quanto tempo de antecedência o sistema deve avisar sobre pagamentos a receber:</small>

              <div className="lead-time-options" role="group" aria-label="Antecedência dos avisos">
                {[
                  { value: '1_hour', label: '1 hora antes', desc: 'No próprio dia do vencimento' },
                  { value: '1_day', label: '1 dia antes', desc: 'Na véspera do vencimento (Recomendado)' },
                  { value: '1_week', label: '1 semana antes', desc: 'Com 7 dias de antecedência' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`lead-time-btn ${notificationLeadTime === opt.value ? 'selected' : ''}`}
                    onClick={() => {
                      setNotificationLeadTime?.(opt.value)
                      notify(`Antecedência alterada para ${opt.label}!`)
                    }}
                  >
                    <div className="lead-time-header">
                      <Clock size={16} />
                      <b>{opt.label}</b>
                      {notificationLeadTime === opt.value && <Check size={16} className="lead-check" />}
                    </div>
                    <span>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="iphone-notification-box">
              <div className="iphone-icon-wrap">
                <Smartphone size={24} />
              </div>
              <div>
                <strong>Compatibilidade com iPhone (iOS)</strong>
                <p>
                  O sistema envia notificações nativas e banners de aviso em tempo real no topo da tela,
                  otimizados para a tela e gestos do iPhone.
                </p>
                <button
                  type="button"
                  className="secondary iphone-btn"
                  onClick={requestIPhoneNotifications}
                >
                  <Bell size={15} style={{ marginRight: 6 }} />
                  Testar / Ativar alertas no iPhone
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Card 4: Permissão de Registrar Venda sem Estoque */}
        <section className="panel settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-badge">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3>Controle de Estoque e Vendas</h3>
              <p>Configure se o sistema permite realizar vendas de itens esgotados.</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="settings-option-row">
              <div>
                <strong>Permitir registrar venda sem estoque</strong>
                <small>
                  {allowOutOfStock
                    ? 'Permissão concedida: você pode lançar vendas mesmo com estoque zerado.'
                    : 'Bloqueado: apenas produtos com estoque disponível podem ser vendidos.'}
                </small>
              </div>
              <label className="switch" aria-label="Permitir venda sem estoque">
                <input
                  type="checkbox"
                  checked={allowOutOfStock}
                  onChange={(e) => {
                    setAllowOutOfStock(e.target.checked)
                    notify(
                      e.target.checked
                        ? 'Permissão de venda sem estoque ativada!'
                        : 'Vendas sem estoque bloqueadas!'
                    )
                  }}
                />
                <span className="slider round" />
              </label>
            </div>

            <div className={`stock-permission-notice ${allowOutOfStock ? 'active' : ''}`}>
              {allowOutOfStock ? (
                <p>
                  ⚠️ <b>Atenção:</b> Ao permitir vendas sem estoque, produtos zerados aparecerão no
                  formulário de <i>Nova Venda</i> e a quantidade em estoque continuará sendo abatida.
                </p>
              ) : (
                <p>
                  🔒 <b>Padrão seguro:</b> O sistema impedirá que sejam vendidas quantidades maiores
                  do que o estoque físico cadastrado.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
