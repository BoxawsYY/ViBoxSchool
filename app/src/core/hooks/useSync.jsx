import { useState, useCallback } from 'react'

export function useSync(initial = []) {
  const [state, setState] = useState(initial)

  const init = useCallback((value) => {
    setState(value || [])
  }, [])

  const sync = useCallback((item, action) => {
    setState(prev => {
      switch (action) {
        case 'create':
          return prev.some(r => r.id === item.id)
            ? prev
            : [...prev, item]

        case 'update':
          return prev.map(r =>
            r.id === item.id ? { ...r, ...item } : r
          )

        case 'delete':
          return prev.filter(r => r.id !== item.id)

        default:
          return prev
      }
    })
  }, [])

  return {
    state,
    set: setState,
    init,
    sync
  }
}
