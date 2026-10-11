import { useState, useEffect, useRef } from 'react'
import {
  Smartphone,
  Monitor,
  RotateCw,
  RefreshCw,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Wifi
} from 'lucide-react'

export default function DeviceSimulator({ onClose }) {
  const [scale, setScale] = useState(0.85)
  const [rotated, setRotated] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [batteryLevel] = useState(96)
  const iframeRef = useRef(null)

  useEffect(() => {
    function updateClock() {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}`)
    }
    updateClock()
    const interval = setInterval(updateClock, 10000)
    return () => clearInterval(interval)
  }, [])

  // Auto-ajustar escala inicial de acordo com a altura da tela disponível
  useEffect(() => {
    const availableHeight = window.innerHeight - 120
    if (availableHeight > 0) {
      const targetHeight = rotated ? 440 : 900
      const calculatedScale = Math.min(1, Math.max(0.6, availableHeight / targetHeight))
      setScale(Number(calculatedScale.toFixed(2)))
    }
  }, [rotated])

  function handleReload() {
    if (iframeRef.current) {
      iframeRef.current.src = '/?preview=mobile_frame&t=' + Date.now()
    }
  }

  // Dimensões exatas do iPhone 16 Pro (393 x 852 px)
  const screenWidth = rotated ? 852 : 393
  const screenHeight = rotated ? 393 : 852
  const chassisPadding = 12
  const chassisWidth = screenWidth + chassisPadding * 2
  const chassisHeight = screenHeight + chassisPadding * 2

  const statusBarHeight = 44
  const homeIndicatorHeight = 24
  const iframeContentHeight = screenHeight - statusBarHeight - homeIndicatorHeight

  return (
    <div className="simulator-overlay">
      {/* Barra de Ferramentas Superior */}
      <header className="simulator-toolbar">
        <div className="sim-toolbar-left">
          <div className="sim-badge">
            <Smartphone size={16} />
            <span>Simulador iPhone (iOS 18)</span>
          </div>
          <span className="sim-dimensions">
            {screenWidth} × {screenHeight} px
          </span>
        </div>

        <div className="sim-toolbar-center">
          <button
            type="button"
            className="sim-btn"
            onClick={() => setRotated(!rotated)}
            title={rotated ? 'Girar para Retrato' : 'Girar para Paisagem'}
          >
            <RotateCw size={15} />
            <span>{rotated ? 'Retrato' : 'Girar'}</span>
          </button>

          <div className="sim-scale-control">
            <button
              type="button"
              className="sim-icon-btn"
              onClick={() => setScale((s) => Math.max(0.5, Number((s - 0.05).toFixed(2))))}
              title="Diminuir Zoom"
            >
              <ZoomOut size={15} />
            </button>
            <span className="sim-scale-label">{Math.round(scale * 100)}%</span>
            <button
              type="button"
              className="sim-icon-btn"
              onClick={() => setScale((s) => Math.min(1.1, Number((s + 0.05).toFixed(2))))}
              title="Aumentar Zoom"
            >
              <ZoomIn size={15} />
            </button>
          </div>

          <div className="sim-scale-presets">
            <button
              type="button"
              className={`sim-preset-btn ${scale === 0.75 ? 'active' : ''}`}
              onClick={() => setScale(0.75)}
            >
              75%
            </button>
            <button
              type="button"
              className={`sim-preset-btn ${scale === 0.85 ? 'active' : ''}`}
              onClick={() => setScale(0.85)}
            >
              85%
            </button>
            <button
              type="button"
              className={`sim-preset-btn ${scale === 1 ? 'active' : ''}`}
              onClick={() => setScale(1)}
            >
              100%
            </button>
          </div>

          <button
            type="button"
            className="sim-btn"
            onClick={handleReload}
            title="Recarregar tela do celular"
          >
            <RefreshCw size={15} />
            <span>Recarregar</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="sim-btn"
            title="Abrir em nova aba"
          >
            <ExternalLink size={15} />
            <span>Nova aba</span>
          </a>
        </div>

        <div className="sim-toolbar-right">
          <button
            type="button"
            className="sim-exit-btn"
            onClick={onClose}
            title="Voltar para a versão Computador"
          >
            <Monitor size={16} />
            <span>Modo Computador</span>
          </button>
        </div>
      </header>

      {/* Palco Centralizado com o iPhone */}
      <div className="simulator-stage">
        {/* Container que reserva o espaço real considerando a escala */}
        <div
          className="iphone-scaler"
          style={{
            width: `${chassisWidth * scale}px`,
            height: `${chassisHeight * scale}px`
          }}
        >
          <div
            className={`iphone-device ${rotated ? 'iphone--landscape' : ''}`}
            style={{
              width: `${chassisWidth}px`,
              height: `${chassisHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }}
          >
            {/* Botões Físicos Laterais do iPhone */}
            {!rotated && (
              <>
                <div className="iphone-btn-action" />
                <div className="iphone-btn-vol-up" />
                <div className="iphone-btn-vol-down" />
                <div className="iphone-btn-power" />
              </>
            )}

            {/* Chassis / Moldura Externa de Titânio */}
            <div
              className="iphone-chassis"
              style={{
                width: `${chassisWidth}px`,
                height: `${chassisHeight}px`,
                padding: `${chassisPadding}px`
              }}
            >
              {/* Tela do iPhone com Cantos Curvados */}
              <div
                className="iphone-screen"
                style={{
                  width: `${screenWidth}px`,
                  height: `${screenHeight}px`
                }}
              >
                {/* Barra de Status iOS */}
                <div className="ios-status-bar" style={{ height: `${statusBarHeight}px` }}>
                  <div className="ios-status-left">
                    <span className="ios-status-time">{currentTime || '09:41'}</span>
                  </div>

                  {/* Ilha Dinâmica (Dynamic Island) */}
                  <div className="ios-dynamic-island">
                    <div className="island-camera" />
                    <div className="island-sensor" />
                  </div>

                  <div className="ios-status-right">
                    <span className="ios-carrier">5G</span>
                    <Wifi size={13} strokeWidth={2.5} />
                    <div className="ios-battery">
                      <span className="battery-level" style={{ width: `${batteryLevel}%` }} />
                    </div>
                  </div>
                </div>

                {/* Conteúdo Real do Site (Iframe com Altura e Largura Travadas) */}
                <iframe
                  ref={iframeRef}
                  src="/?preview=mobile_frame"
                  title="Visualização iPhone"
                  className="iphone-iframe"
                  style={{
                    width: `${screenWidth}px`,
                    height: `${iframeContentHeight}px`
                  }}
                />

                {/* Barra de Início (Home Indicator) do iOS */}
                <div className="ios-home-indicator-bar" style={{ height: `${homeIndicatorHeight}px` }}>
                  <div className="ios-home-indicator" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
