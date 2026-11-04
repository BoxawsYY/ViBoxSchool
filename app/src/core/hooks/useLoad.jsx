import { useState, useCallback } from 'react'

export function useLoad(initialState = false) {
  const [loading, setLoading] = useState(initialState)

  const startLoading = useCallback(() => setLoading(true), [])
  const stopLoading = useCallback(() => setLoading(false), [])

  const withLoad = useCallback(async (callback) => {
    try {
      startLoading()
      const result = await callback()
      return result
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  return {
    loading,
    setLoading,
    startLoading,
    stopLoading,
    withLoad
  }
}