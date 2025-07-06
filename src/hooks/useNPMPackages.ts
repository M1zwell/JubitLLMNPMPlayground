import { useState, useEffect, useCallback, useMemo } from 'react'
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

  // Calculate stats from packages data
  const stats = useMemo(() => {
    const total = packages.length;
    const totalDownloads = packages.reduce((sum, pkg) => sum + (pkg.weekly_downloads || 0), 0);
    const avgQuality = packages.length > 0 
      ? packages.reduce((sum, pkg) => sum + (pkg.quality_score || 0), 0) / packages.length 
      : 0;
    const withTypeScript = packages.filter(pkg => pkg.typescript_support || pkg.has_typescript).length;

    return {
      total,
      totalDownloads,
      avgQuality,
      withTypeScript
    };
  }, [packages]);

  // Define fetchPackages as a named function to avoid reference issues
  async function fetchPackages() {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching NPM packages with filters:', filters);
      console.log('Supabase URL:', supabaseUrlForLogging || 'Not configured');
      
      // Check if Supabase is configured
      if (!supabase) {
        const errorMsg = 'Supabase is not configured. Please click "Connect to Supabase" in the top right to set up your database connection.';
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
      
      // Additional validation
      if (!supabaseUrlForLogging) {
        const errorMsg = 'Supabase URL is missing. Please check your environment variables.';
        console.error(errorMsg);
        setError(errorMsg);
        return;
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

      console.log('Executing Supabase query...');
      const { data, error } = await query

      if (error) {
        console.error('Supabase query error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
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
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      
      // Provide more specific error messages
      if (errorMessage.includes('Failed to fetch')) {
        setError('Unable to connect to the database. Please check your internet connection and Supabase configuration.');
      } else if (errorMessage.includes('Invalid API key')) {
        setError('Invalid Supabase API key. Please check your environment variables.');
      } else if (errorMessage.includes('permission denied')) {
        setError('Access denied. Please check your database permissions.');
      } else {
        setError(errorMessage);
      }
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

  return { packages, loading, error, refetch, stats }
}

export function useNPMCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true)
        setError(null)
        
        // Check if Supabase is configured
        if (!supabase) {
          const errorMsg = 'Supabase is not configured. Please click "Connect to Supabase" in the top right to set up your database connection.';
          console.error(errorMsg);
          setError(errorMsg);
          return;
        }
        
        if (!supabaseUrlForLogging) {
          const errorMsg = 'Supabase URL is missing. Please check your environment variables.';
          console.error(errorMsg);
          setError(errorMsg);
          return;
        }
        
        console.log('Fetching NPM categories...');
        const { data, error } = await supabase
          .from('npm_categories')
          .select('*')
          .order('name')

        if (error) {
          console.error('Supabase categories query error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        console.log(`Successfully fetched ${data?.length || 0} categories`);
        setCategories(data || [])
      } catch (err) {
        console.error('Error fetching NPM categories:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        
        if (errorMessage.includes('Failed to fetch')) {
          setError('Unable to connect to the database. Please check your internet connection and Supabase configuration.');
        } else {
          setError(errorMessage);
        }
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
    throw new Error('Supabase is not configured. Please click "Connect to Supabase" to set up your database connection.')
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Supabase API key is missing. Please check your environment variables.')
  }
  
  const apiUrl = `${supabaseUrlForLogging}/functions/v1/npm-import`;
  
  console.log('Importing NPM packages with params:', params);
  
  const headers = {
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  console.log('Making NPM import request to:', apiUrl);
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    console.error('NPM import failed:', errorText);
    
    if (response.status === 404) {
      throw new Error('NPM import function not found. Please ensure your Supabase Edge Functions are deployed.');
    } else if (response.status === 401) {
      throw new Error('Unauthorized access. Please check your Supabase API key.');
    } else {
      throw new Error(`Import failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }

  const result = await response.json();
  console.log('NPM import successful:', result);
  return result;
}