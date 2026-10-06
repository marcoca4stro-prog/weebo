import { useEffect, useState } from 'react'

export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      let saved = window.localStorage.getItem(key)
      // Migração suave de winkbi:* para weebo:*
      if (!saved && key.startsWith('weebo:')) {
        const legacyKey = key.replace(/^weebo:/, 'winkbi:')
        saved = window.localStorage.getItem(legacyKey)
      }
      return saved ? JSON.parse(saved) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.warn('Erro ao salvar no localStorage', e)
    }
  }, [key, value])

  return [value, setValue]
}
