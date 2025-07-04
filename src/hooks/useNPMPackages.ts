import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, NPMPackage } from '../lib/supabase'

export function useNPMPackages(filters?: {
  category?: string
  search?: string
  sortBy?: string
  sortDesc?: boolean
  limit?: number
}) {
  const [packages, setPackages] = useState<NPMPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('npm_packages')
        .select('*')

      // Apply filters
      if (filters?.category && filters.category !== 'all') {
        query = query.or(`categories.cs.{${filters.category}},keywords.cs.{${filters.category}}`)
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Apply sorting
      if (filters?.sortBy) {
        const column = filters.sortBy === 'downloads' ? 'weekly_downloads' : 
                      filters.sortBy === 'stars' ? 'github_stars' :
                      filters.sortBy === 'quality' ? 'quality_score' :
                      filters.sortBy === 'updated' ? 'last_published' : 'name'
        
        query = query.order(column, { 
          ascending: !filters.sortDesc,
          nullsLast: true 
        })
      } else {
        query = query.order('weekly_downloads', { ascending: false })
      }

      // Apply limit
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error

      setPackages(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [filters?.category, filters?.search, filters?.sortBy, filters?.sortDesc, filters?.limit])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  // Create a stable reference to fetchPackages that won't change between renders
  const fetchPackagesRef = useRef(fetchPackages);
  useEffect(() => {
    fetchPackagesRef.current = fetchPackages;
  }, [fetchPackages]);

  // Create a stable refetch function that always uses the current fetchPackages implementation
  const refetch = useCallback(() => {
    return fetchPackagesRef.current();
  }, []);

  return { packages, loading, error, refetch }
}

export function useNPMCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('npm_categories')
          .select('*')
          .order('name')

        if (error) throw error

        setCategories(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, loading, error }
}

export async function importNPMPackages(params: {
  searchQuery?: string
  categories?: string[]
  limit?: number
  pages?: number
  sortBy?: string
  importType?: 'manual' | 'automatic'
}) {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/npm-import`;
  
  const headers = {
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    throw new Error(`Import failed: ${response.statusText}`);
  }

  return await response.json();
}