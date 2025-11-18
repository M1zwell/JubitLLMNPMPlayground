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

export interface ResponsibleOfficer {
  id: string;
  period: string;
  period_type: string;
  activity_type: string;
  officer_count: number;
  yoy_change: number | null;
}

/**
 * A1 Market Highlights - Normalized schema
 */
export interface A1MarketHighlight {
  id: string;
  period_type: 'year' | 'quarter';
  year: number;
  quarter: number | null;
  main_listed: number | null;
  main_mktcap_hkbn: number | null;
  main_turnover_hkmm: number | null;
  gem_listed: number | null;
  gem_mktcap_hkbn: number | null;
  gem_turnover_hkmm: number | null;
  trading_days: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface A1LatestMetrics {
  year: number;
  mainListings: number;
  gemListings: number;
  totalListings: number;
  mainMarketCap: number;
  gemMarketCap: number;
  totalMarketCap: number;
  mainTurnover: number;
  gemTurnover: number;
  gemMarketShare: number; // % of total market cap
  tradingDays: number;
  // YoY changes
  yoyMainCapChange: number | null;
  yoyTurnoverChange: number | null;
  yoyListingsChange: number | null;
  yoyGemShareChange: number | null;
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

export function useSFCResponsibleOfficers(limit = 100) {
  const [data, setData] = useState<ResponsibleOfficer[]>([]);
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

        const { data: officersData, error: fetchError } = await supabase
          .from('sfc_responsible_officers')
          .select('*')
          .order('period', { ascending: false })
          .limit(limit);

        if (fetchError) throw fetchError;

        setData(officersData || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching responsible officers:', err);
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

/**
 * A1 Market Highlights - Annual data (1997-present)
 */
export function useA1MarketHighlights(limit = 50) {
  const [data, setData] = useState<A1MarketHighlight[]>([]);
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

        const { data: annualData, error: fetchError } = await supabase
          .from('a1_market_highlights')
          .select('*')
          .eq('period_type', 'year')
          .order('year', { ascending: false })
          .limit(limit);

        if (fetchError) throw fetchError;

        setData(annualData || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching A1 market highlights:', err);
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

/**
 * A1 Quarterly Data - Recent quarters only
 */
export function useA1QuarterlyData(limit = 12) {
  const [data, setData] = useState<A1MarketHighlight[]>([]);
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

        const { data: quarterlyData, error: fetchError } = await supabase
          .from('a1_market_highlights')
          .select('*')
          .eq('period_type', 'quarter')
          .order('year', { ascending: false })
          .order('quarter', { ascending: false })
          .limit(limit);

        if (fetchError) throw fetchError;

        setData(quarterlyData || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching A1 quarterly data:', err);
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

/**
 * A1 Latest Metrics - Most recent year with YoY calculations
 */
export function useA1LatestMetrics() {
  const [data, setData] = useState<A1LatestMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!supabase) {
          setData(null);
          setIsLoading(false);
          return;
        }

        // Get latest 2 years for YoY calculation
        const { data: recentYears, error: fetchError } = await supabase
          .from('a1_market_highlights')
          .select('*')
          .eq('period_type', 'year')
          .order('year', { ascending: false })
          .limit(2);

        if (fetchError) throw fetchError;

        if (!recentYears || recentYears.length === 0) {
          setData(null);
          setError('No data available');
          setIsLoading(false);
          return;
        }

        const latest = recentYears[0];
        const previous = recentYears[1];

        const mainCap = latest.main_mktcap_hkbn || 0;
        const gemCap = latest.gem_mktcap_hkbn || 0;
        const totalCap = mainCap + gemCap;

        const metrics: A1LatestMetrics = {
          year: latest.year,
          mainListings: latest.main_listed || 0,
          gemListings: latest.gem_listed || 0,
          totalListings: (latest.main_listed || 0) + (latest.gem_listed || 0),
          mainMarketCap: mainCap,
          gemMarketCap: gemCap,
          totalMarketCap: totalCap,
          mainTurnover: latest.main_turnover_hkmm || 0,
          gemTurnover: latest.gem_turnover_hkmm || 0,
          gemMarketShare: totalCap > 0 ? (gemCap / totalCap) * 100 : 0,
          tradingDays: latest.trading_days || 0,
          yoyMainCapChange: null,
          yoyTurnoverChange: null,
          yoyListingsChange: null,
          yoyGemShareChange: null,
        };

        // Calculate YoY changes if previous year exists
        if (previous) {
          const prevMainCap = previous.main_mktcap_hkbn || 0;
          const prevGemCap = previous.gem_mktcap_hkbn || 0;
          const prevTotalCap = prevMainCap + prevGemCap;
          const prevGemShare = prevTotalCap > 0 ? (prevGemCap / prevTotalCap) * 100 : 0;

          if (prevMainCap > 0) {
            metrics.yoyMainCapChange = ((mainCap - prevMainCap) / prevMainCap) * 100;
          }

          const prevTurnover = previous.main_turnover_hkmm || 0;
          if (prevTurnover > 0) {
            metrics.yoyTurnoverChange = ((metrics.mainTurnover - prevTurnover) / prevTurnover) * 100;
          }

          const prevListings = (previous.main_listed || 0) + (previous.gem_listed || 0);
          if (prevListings > 0) {
            metrics.yoyListingsChange = ((metrics.totalListings - prevListings) / prevListings) * 100;
          }

          if (prevGemShare > 0) {
            metrics.yoyGemShareChange = metrics.gemMarketShare - prevGemShare;
          }
        }

        setData(metrics);
        setError(null);
      } catch (err) {
        console.error('Error fetching A1 latest metrics:', err);
        setError((err as Error).message);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

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
