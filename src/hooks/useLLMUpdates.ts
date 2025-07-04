import { useState } from 'react'

interface UpdateStats {
  total_processed: number
  models_added: number
  models_updated: number
  providers_found: string[]
  categories_updated: string[]
}

interface UpdateLog {
  id: string
  update_type: 'manual' | 'automatic' | 'scheduled'
  status: 'in_progress' | 'success' | 'error'
  models_processed: number
  models_added: number
  models_updated: number
  providers_updated: string[]
  error_message?: string
  started_at: string
  completed_at?: string
}

export function useLLMUpdates() {
  const [updating, setUpdating] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<UpdateLog | null>(null)

  const triggerUpdate = async (updateType: 'manual' | 'automatic' = 'manual') => {
    try {
      setUpdating(true)
      setUpdateStatus('Starting update...')
      
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llm-update`
      
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ update_type: updateType })
      })

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setUpdateStatus(`✅ Update completed! ${result.stats.models_added} models added, ${result.stats.models_updated} models updated`)
        setLastUpdate({
          id: result.logId,
          update_type: updateType,
          status: 'success',
          models_processed: result.stats.total_processed,
          models_added: result.stats.models_added,
          models_updated: result.stats.models_updated,
          providers_updated: result.stats.providers_found,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
      } else {
        throw new Error(result.error || 'Update failed')
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed'
      setUpdateStatus(`❌ ${errorMessage}`)
      throw error
    } finally {
      setUpdating(false)
    }
  }

  const checkUpdateStatus = async () => {
    try {
      // This would fetch the latest update log from the database
      // Implementation depends on your Supabase setup
      return lastUpdate
    } catch (error) {
      console.error('Failed to check update status:', error)
      return null
    }
  }

  const scheduleUpdate = async (intervalHours: number = 24) => {
    // This would set up a scheduled update
    // In a real implementation, you might use a cron job or scheduled function
    console.log(`Scheduling updates every ${intervalHours} hours`)
    
    // For demo purposes, we'll just trigger an update
    return triggerUpdate('scheduled' as any)
  }

  return {
    updating,
    updateStatus,
    lastUpdate,
    triggerUpdate,
    checkUpdateStatus,
    scheduleUpdate
  }
}