/**
 * React Hook for CCASS Holdings Data
 * Fetches and manages HKEX CCASS shareholding data from Supabase
 */

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface CCassHolding {
  id: string;
  stock_code: string;
  stock_name?: string;
  shareholding_date?: string;
  participant_id: string;
  participant_name: string;
  address?: string;
  shareholding: string | number;
  percentage: string | number;
  content_hash: string;
  scraped_at: string;
  created_at: string;
  updated_at: string;
}

export interface CCASSFilters {
  stockCode?: string;
  participant?: string;
  minPercentage?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export function useCCASSData(filters?: CCASSFilters) {
  const [data, setData] = useState<CCassHolding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('hkex_ccass_holdings')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.stockCode) {
        query = query.eq('stock_code', filters.stockCode);
      }

      if (filters?.participant) {
        query = query.or(`participant_id.eq.${filters.participant},participant_name.ilike.%${filters.participant}%`);
      }

      if (filters?.minPercentage) {
        query = query.gte('percentage', filters.minPercentage);
      }

      if (filters?.dateFrom) {
        query = query.gte('shareholding_date', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('shareholding_date', filters.dateTo);
      }

      // Order by date desc, then shareholding descending
      query = query.order('shareholding_date', { ascending: false }).order('shareholding', { ascending: false });

      // Apply limit
      const limit = filters?.limit || 100;
      query = query.limit(limit);

      const { data: holdings, error: queryError, count } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      setData(holdings || []);
      setTotalRecords(count || 0);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading CCASS data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    loadData();
  }, [
    filters?.stockCode,
    filters?.participant,
    filters?.minPercentage,
    filters?.dateFrom,
    filters?.dateTo,
    filters?.limit
  ]);

  return {
    data,
    isLoading,
    error,
    totalRecords,
    reload: loadData
  };
}

/**
 * Get top shareholders for a stock
 */
export async function getTopShareholders(stockCode: string, limit = 20): Promise<CCassHolding[]> {
  const { data, error } = await supabase
    .from('hkex_ccass_holdings')
    .select('*')
    .eq('stock_code', stockCode)
    .order('shareholding', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top shareholders:', error);
    return [];
  }

  return data || [];
}

/**
 * Get unique stock codes
 */
export async function getStockCodes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('hkex_ccass_holdings')
    .select('stock_code')
    .order('stock_code');

  if (error) {
    console.error('Error fetching stock codes:', error);
    return [];
  }

  const uniqueCodes = [...new Set(data.map(d => d.stock_code))];
  return uniqueCodes;
}

/**
 * Get statistics for a stock
 */
export async function getStockStatistics(stockCode: string) {
  const { data, error } = await supabase
    .from('hkex_ccass_holdings')
    .select('*')
    .eq('stock_code', stockCode);

  if (error || !data || data.length === 0) {
    return null;
  }

  const totalShares = data.reduce((sum, h) => sum + Number(h.shareholding), 0);
  const totalParticipants = data.length;

  // Calculate top 5 concentration
  const top5 = data
    .sort((a, b) => Number(b.shareholding) - Number(a.shareholding))
    .slice(0, 5);

  const top5Percentage = top5.reduce((sum, h) => sum + Number(h.percentage), 0);

  return {
    stockCode,
    stockName: data[0].stock_name || '',
    totalShares,
    totalParticipants,
    top5Percentage: top5Percentage.toFixed(2),
    top5Shareholders: top5
  };
}
