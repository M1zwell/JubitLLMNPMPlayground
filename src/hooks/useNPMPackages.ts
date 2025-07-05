import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, NPMPackage, supabaseUrlForLogging } from '../lib/supabase'

// Interface for NPM package filter options
interface NPMPackageFilters {
  category?: string;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
  limit?: number;
}

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

  // Define fetchPackages as a named function to avoid reference issues
  async function fetchPackages() {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching NPM packages with filters:', filters);
      console.log('Supabase URL:', supabaseUrlForLogging || 'Not configured');
      
      // Check if Supabase is configured
      if (!supabase) {
        throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
      }
      let query = supabase
        .from('npm_packages')
        .select('*')
        .limit(filters?.limit || 1000) // Ensure we get all packages

      // Apply filters
      if (filters?.category && filters.category !== 'all-packages') {
        query = query.contains('categories', [filters.category]);
        console.log(`Filtering by category: ${filters.category}`);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
        console.log(`Searching for: ${filters.search}`);
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
      
      console.log(`Successfully fetched ${data?.length || 0} NPM packages`);

      if (data && data.length > 0) {
        console.log(`First package:`, data[0].name);
        console.log(`Categories of first package:`, data[0].categories);
      } else {
        console.log('No packages found matching criteria');
      }
      
      setPackages(data || []);
    } catch (err) {
      console.error('Error fetching NPM packages:', err);
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Use effect to fetch packages when filters change
  useEffect(() => {
    fetchPackages()
  }, [filters?.category, filters?.search, filters?.sortBy, filters?.sortDesc, filters?.limit])

  // Create a stable reference to fetchPackages that won't change between renders
  const refetch = useCallback(() => fetchPackages(), [filters]);

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
        
        // Check if Supabase is configured
        if (!supabase) {
          throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
        }
        
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
  if (!supabaseUrlForLogging) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
  }
  
  const apiUrl = `${supabaseUrlForLogging}/functions/v1/npm-import`;
  
  console.log('Importing NPM packages with params:', params);
  
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
    const errorText = await response.text().catch(() => 'Unknown error');
    console.error('NPM import failed:', errorText);
    throw new Error(`Import failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log('NPM import successful:', result);
  return result;
}