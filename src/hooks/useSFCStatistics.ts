/**
 * Hook to fetch real SFC statistics data from Supabase
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface MarketHighlight {
  id: string;
  period: string;
  period_type: string;
  market_cap: number;
  turnover: number;
  total_listings: number;
  new_listings: number;
  funds_raised: number;
}

export interface MarketCapByType {
  id: string;
  period: string;
  stock_type: string;
  market_cap: number;
  percentage: number;
  number_of_companies: number;
}

export interface FundFlow {
  id: string;
  period: string;
  fund_category: string;
  subscriptions: number;
  redemptions: number;
  net_flows: number;
  flow_rate: number;
}

export interface TurnoverByType {
  id: string;
  period: string;
  stock_type: string;
  turnover: number;
  percentage: number;
}

export interface MutualFundNAV {
  id: string;
  period: string;
  period_type: string;
  fund_category: string;
  fund_count: number;
  nav: number;
  percentage: number;
}

export interface LicensedRepresentative {
  id: string;
  period: string;
  activity_type: string;
  representative_count: number;
}

export function useSFCMarketHighlights(limit = 20) {
  const [data, setData] = useState<MarketHighlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!supabase) {
          setData([]);
          setIsLoading(false);
          return;
        }

        const { data: highlights, error: fetchError } = await supabase
          .from('sfc_market_highlights')
          .select('*')
          .order('period', { ascending: false })
          .limit(limit);

        if (fetchError) throw fetchError;

        setData(highlights || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching market highlights:', err);
        setError((err as Error).message);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [limit]);

  return { data, isLoading, error };
}

export function useSFCMarketCapByType(period?: string) {
  const [data, setData] = useState<MarketCapByType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!supabase) {
          setData([]);
          setIsLoading(false);
          return;
        }

        let query = supabase
          .from('sfc_market_cap_by_type')
          .select('*');

        if (period) {
          query = query.eq('period', period);
        } else {
          // Get latest period
          const { data: latest } = await supabase
            .from('sfc_market_cap_by_type')
            .select('period')
            .order('period', { ascending: false })
            .limit(1)
            .single();

          if (latest) {
            query = query.eq('period', latest.period);
          }
        }

        const { data: marketCap, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setData(marketCap || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching market cap by type:', err);
        setError((err as Error).message);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [period]);

  return { data, isLoading, error };
}

export function useSFCFundFlows(limit = 10) {
  const [data, setData] = useState<FundFlow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!supabase) {
          setData([]);
          setIsLoading(false);
          return;
        }

        const { data: flows, error: fetchError } = await supabase
          .from('sfc_fund_flows')
          .select('*')
          .order('period', { ascending: false })
          .limit(limit);

        if (fetchError) throw fetchError;

        setData(flows || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching fund flows:', err);
        setError((err as Error).message);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [limit]);

  return { data, isLoading, error };
}

export function useSFCTurnoverByType(period?: string) {
  const [data, setData] = useState<TurnoverByType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!supabase) {
          setData([]);
          setIsLoading(false);
          return;
        }

        let query = supabase
          .from('sfc_turnover_by_type')
          .select('*')
          .order('period', { ascending: false });

        if (period) {
          query = query.eq('period', period);
        }

        const { data: turnover, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setData(turnover || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching turnover by type:', err);
        setError((err as Error).message);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [period]);

  return { data, isLoading, error };
}

export function useSFCMutualFundNAV(limit = 100) {
  const [data, setData] = useState<MutualFundNAV[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!supabase) {
          setData([]);
          setIsLoading(false);
          return;
        }

        const { data: fundData, error: fetchError } = await supabase
          .from('sfc_mutual_fund_nav')
          .select('*')
          .order('period', { ascending: false })
          .limit(limit);

        if (fetchError) throw fetchError;

        setData(fundData || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching mutual fund NAV:', err);
        setError((err as Error).message);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [limit]);

  return { data, isLoading, error };
}

export function useSFCLicensedReps(limit = 100) {
  const [data, setData] = useState<LicensedRepresentative[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!supabase) {
          setData([]);
          setIsLoading(false);
          return;
        }

        const { data: repsData, error: fetchError } = await supabase
          .from('sfc_licensed_representatives')
          .select('*')
          .order('period', { ascending: false })
          .limit(limit);

        if (fetchError) throw fetchError;

        setData(repsData || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching licensed representatives:', err);
        setError((err as Error).message);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [limit]);

  return { data, isLoading, error };
}

// Get latest data period
export async function getLatestDataPeriod(table: string): Promise<string | null> {
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from('sfc_statistics_metadata')
      .select('data_period')
      .eq('table_id', table)
      .single();

    return data?.data_period || null;
  } catch {
    return null;
  }
}
