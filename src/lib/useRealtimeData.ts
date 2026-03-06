'use client'
import { useEffect, useState, useCallback } from 'react'

export function useRealtimeData<T>(
  apiUrl: string,
  table: string,
  filter?: string
) {
  const [data, setData]             = useState<T[]>([])
  const [loading, setLoading]       = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(apiUrl)
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
      setLastUpdate(new Date())
    } catch (e) {
      console.error('Fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [apiUrl])

  useEffect(() => {
    fetchData()
    // Refresh automatique toutes les 30 secondes
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  return { data, loading, lastUpdate, refresh: fetchData }
}
