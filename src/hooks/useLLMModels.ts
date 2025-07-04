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
      
      // Check if Supabase is configured
      if (!supabase) {
        setError('Supabase connection not configured. Please click the "Connect to Supabase" button in the top right to set up your database connection.')
        setLoading(false)
        return
      }
      
      console.log('Fetching LLM models from Supabase...')
      
      const { data, error } = await supabase
        .from('llm_models')
        .select('*')
        .limit(1000) // Ensure we get all models
        .order('quality_index', { ascending: false, nullsLast: true })

      if (error) {
        console.error('Supabase query error:', error)
        if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          throw new Error('Unable to connect to Supabase. Please check your internet connection and ensure your Supabase project is active. You may need to click "Connect to Supabase" in the top right to configure your connection.')
        } else {
          throw new Error(`Database error: ${error.message}`)
        }
      }

      console.log('Successfully fetched models:', data?.length || 0)

      setModels(data || [])
    } catch (err) {
      console.error('Fetch models error:', err)
      
      if (err instanceof TypeError && (err.message.includes('Failed to fetch') || err.message.includes('fetch'))) {
        setError('Connection failed: Unable to reach Supabase. Please ensure:\n• Your internet connection is working\n• Your Supabase project is active\n• You have configured the Supabase connection (click "Connect to Supabase" in the top right)')
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only attempt to fetch if we have some indication of Supabase config
    const hasSupabaseConfig = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (hasSupabaseConfig) {
      fetchModels()
    } else {
      setError('Supabase connection not configured. Please click the "Connect to Supabase" button in the top right to set up your database connection.')
      setLoading(false)
    }
  }, [])

  return { models, loading, error, refetch: fetchModels }
}