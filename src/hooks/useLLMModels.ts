import { useState, useEffect } from 'react'
import { supabase, LLMModel } from '../lib/supabase'

export function useLLMModels() {
  const [models, setModels] = useState<LLMModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Test Supabase connection first
      console.log('Testing Supabase connection...')
      
      const { data, error } = await supabase
        .from('llm_models')
        .select('*')
        .limit(1000) // Ensure we get all models
        .select('*')
        .order('quality_index', { ascending: false, nullsLast: true })

      if (error) {
        console.error('Supabase query error:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('Successfully fetched models:', data?.length || 0)

      setModels(data || [])
    } catch (err) {
      console.error('Fetch models error:', err)
      
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError('Unable to connect to the database. Please check your internet connection and Supabase configuration.')
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  return { models, loading, error, refetch: fetchModels }
}