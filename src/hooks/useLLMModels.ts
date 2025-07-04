import { useState, useEffect } from 'react'
import { supabase, LLMModel } from '../lib/supabase'

export function useLLMModels() {
  const [models, setModels] = useState<LLMModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('llm_models')
        .select('*')
        .order('quality_index', { ascending: false, nullsLast: true })

      if (error) throw error

      setModels(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  return { models, loading, error, refetch: fetchModels }
}