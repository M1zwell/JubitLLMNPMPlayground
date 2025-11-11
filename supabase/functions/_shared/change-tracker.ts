/**
 * Change Tracking Module
 *
 * Detects and records changes in HKEX CCASS shareholdings
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// Types
// ============================================================================

export interface CCAASSSnapshot {
  stockCode: string;
  dataDate: string;
  stockName: string;
  totalParticipants: number;
  totalShares: number;
  participants: CCAASSParticipant[];
  screenshotUrl?: string;
  extractionMethod?: 'html' | 'json' | 'puppeteer';
}

export interface CCAASSParticipant {
  participantId: string;
  participantName: string;
  address?: string;
  shareholding: number;
  percentage: number;
}

export interface ShareholdingChange {
  stockCode: string;
  participantId: string;
  participantName: string;
  fromDate: string;
  toDate: string;
  previousShareholding: number | null;
  currentShareholding: number | null;
  shareChange: number;
  previousPercentage: number | null;
  currentPercentage: number | null;
  percentageChange: number;
  percentChangeMagnitude: number;
  changeType: 'NEW_PARTICIPANT' | 'EXIT_PARTICIPANT' | 'SIGNIFICANT_INCREASE' | 'SIGNIFICANT_DECREASE' | 'MINOR_CHANGE';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// Change Tracker Class
// ============================================================================

export class CCAASSChangeTracker {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Save a snapshot to the database
   */
  async saveSnapshot(snapshot: CCAASSSnapshot): Promise<{ id: string }> {
    console.log(`[Change Tracker] Saving snapshot for ${snapshot.stockCode} (${snapshot.totalParticipants} participants)`);

    const { data, error } = await this.supabase
      .from('hkex_ccass_snapshots')
      .insert({
        stock_code: snapshot.stockCode,
        data_date: snapshot.dataDate,
        stock_name: snapshot.stockName,
        total_participants: snapshot.totalParticipants,
        total_shares: snapshot.totalShares,
        participants: snapshot.participants,
        screenshot_url: snapshot.screenshotUrl,
        extraction_method: snapshot.extractionMethod || 'html',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Change Tracker] Failed to save snapshot:', error);
      throw new Error(`Failed to save snapshot: ${error.message}`);
    }

    console.log(`[Change Tracker] ✅ Snapshot saved: ${data.id}`);
    return { id: data.id };
  }

  /**
   * Get the most recent snapshot for a stock before a given date
   */
  async getPreviousSnapshot(stockCode: string, beforeDate: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('hkex_ccass_snapshots')
      .select('*')
      .eq('stock_code', stockCode)
      .lt('data_date', beforeDate)
      .order('data_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[Change Tracker] Error fetching previous snapshot:', error);
      return null;
    }

    return data;
  }

  /**
   * Detect changes between two snapshots
   */
  detectChanges(
    previous: CCAASSSnapshot,
    current: CCAASSSnapshot
  ): ShareholdingChange[] {
    console.log(`[Change Tracker] Detecting changes for ${current.stockCode} (${previous.dataDate} → ${current.dataDate})`);

    const changes: ShareholdingChange[] = [];

    // Create maps for quick lookup
    const previousMap = new Map(
      previous.participants.map(p => [p.participantId, p])
    );
    const currentMap = new Map(
      current.participants.map(p => [p.participantId, p])
    );

    // Check for new and changed participants
    for (const currentParticipant of current.participants) {
      const previousParticipant = previousMap.get(currentParticipant.participantId);

      if (!previousParticipant) {
        // New participant
        const change = this.createChange(
          current.stockCode,
          currentParticipant,
          null,
          currentParticipant,
          previous.dataDate,
          current.dataDate
        );
        if (change) changes.push(change);
      } else {
        // Existing participant - check for changes
        const shareChange = currentParticipant.shareholding - previousParticipant.shareholding;
        const percentChange = currentParticipant.percentage - previousParticipant.percentage;
        const percentChangeMagnitude = previousParticipant.shareholding > 0
          ? (shareChange / previousParticipant.shareholding) * 100
          : 0;

        // Only record if significant change (>1% magnitude)
        if (Math.abs(percentChangeMagnitude) > 1) {
          const change = this.createChange(
            current.stockCode,
            currentParticipant,
            previousParticipant,
            currentParticipant,
            previous.dataDate,
            current.dataDate
          );
          if (change) changes.push(change);
        }
      }
    }

    // Check for exited participants
    for (const previousParticipant of previous.participants) {
      if (!currentMap.has(previousParticipant.participantId)) {
        const change = this.createChange(
          current.stockCode,
          previousParticipant,
          previousParticipant,
          null,
          previous.dataDate,
          current.dataDate
        );
        if (change) changes.push(change);
      }
    }

    console.log(`[Change Tracker] Detected ${changes.length} changes`);
    return changes;
  }

  /**
   * Create a change record
   */
  private createChange(
    stockCode: string,
    participant: CCAASSParticipant,
    previous: CCAASSParticipant | null,
    current: CCAASSParticipant | null,
    fromDate: string,
    toDate: string
  ): ShareholdingChange | null {
    const previousShareholding = previous?.shareholding || 0;
    const currentShareholding = current?.shareholding || 0;
    const shareChange = currentShareholding - previousShareholding;

    const previousPercentage = previous?.percentage || 0;
    const currentPercentage = current?.percentage || 0;
    const percentageChange = currentPercentage - previousPercentage;

    const percentChangeMagnitude = previousShareholding > 0
      ? (shareChange / previousShareholding) * 100
      : (currentShareholding > 0 ? 100 : 0);

    // Classify change type
    let changeType: ShareholdingChange['changeType'];
    if (previous === null) {
      changeType = 'NEW_PARTICIPANT';
    } else if (current === null) {
      changeType = 'EXIT_PARTICIPANT';
    } else if (percentChangeMagnitude > 5) {
      changeType = 'SIGNIFICANT_INCREASE';
    } else if (percentChangeMagnitude < -5) {
      changeType = 'SIGNIFICANT_DECREASE';
    } else {
      changeType = 'MINOR_CHANGE';
    }

    // Calculate severity
    const severity = this.calculateSeverity(percentChangeMagnitude);

    return {
      stockCode,
      participantId: participant.participantId,
      participantName: participant.participantName,
      fromDate,
      toDate,
      previousShareholding: previous?.shareholding || null,
      currentShareholding: current?.shareholding || null,
      shareChange,
      previousPercentage: previous?.percentage || null,
      currentPercentage: current?.percentage || null,
      percentageChange,
      percentChangeMagnitude,
      changeType,
      severity,
    };
  }

  /**
   * Calculate severity based on magnitude of change
   */
  private calculateSeverity(percentChangeMagnitude: number): 'low' | 'medium' | 'high' | 'critical' {
    const abs = Math.abs(percentChangeMagnitude);
    if (abs >= 20) return 'critical';
    if (abs >= 10) return 'high';
    if (abs >= 5) return 'medium';
    return 'low';
  }

  /**
   * Save detected changes to the database
   */
  async saveChanges(changes: ShareholdingChange[], previousSnapshotId?: string, currentSnapshotId?: string): Promise<void> {
    if (changes.length === 0) {
      console.log('[Change Tracker] No changes to save');
      return;
    }

    console.log(`[Change Tracker] Saving ${changes.length} changes...`);

    const records = changes.map(change => ({
      stock_code: change.stockCode,
      participant_id: change.participantId,
      participant_name: change.participantName,
      from_date: change.fromDate,
      to_date: change.toDate,
      previous_shareholding: change.previousShareholding,
      current_shareholding: change.currentShareholding,
      share_change: change.shareChange,
      previous_percentage: change.previousPercentage,
      current_percentage: change.currentPercentage,
      percentage_change: change.percentageChange,
      percent_change_magnitude: change.percentChangeMagnitude,
      change_type: change.changeType,
      severity: change.severity,
      previous_snapshot_id: previousSnapshotId,
      current_snapshot_id: currentSnapshotId,
    }));

    const { error } = await this.supabase
      .from('hkex_ccass_changes')
      .insert(records);

    if (error) {
      console.error('[Change Tracker] Failed to save changes:', error);
      throw new Error(`Failed to save changes: ${error.message}`);
    }

    console.log(`[Change Tracker] ✅ Saved ${changes.length} changes`);
  }

  /**
   * Process a snapshot: save it and detect changes
   */
  async processSnapshot(snapshot: CCAASSSnapshot): Promise<{
    snapshotId: string;
    changes: ShareholdingChange[];
  }> {
    // Save current snapshot
    const { id: snapshotId } = await this.saveSnapshot(snapshot);

    // Get previous snapshot
    const previousSnapshot = await this.getPreviousSnapshot(
      snapshot.stockCode,
      snapshot.dataDate
    );

    let changes: ShareholdingChange[] = [];

    if (previousSnapshot) {
      // Detect changes
      const previousData: CCAASSSnapshot = {
        stockCode: previousSnapshot.stock_code,
        dataDate: previousSnapshot.data_date,
        stockName: previousSnapshot.stock_name,
        totalParticipants: previousSnapshot.total_participants,
        totalShares: previousSnapshot.total_shares,
        participants: previousSnapshot.participants,
      };

      changes = this.detectChanges(previousData, snapshot);

      // Save changes
      if (changes.length > 0) {
        await this.saveChanges(changes, previousSnapshot.id, snapshotId);
      }
    } else {
      console.log(`[Change Tracker] No previous snapshot found for ${snapshot.stockCode} - this is the first record`);
    }

    return {
      snapshotId,
      changes,
    };
  }

  /**
   * Get recent changes for a stock
   */
  async getRecentChanges(stockCode: string, limit = 20): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('hkex_ccass_changes')
      .select('*')
      .eq('stock_code', stockCode)
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Change Tracker] Error fetching recent changes:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get significant changes (high/critical severity)
   */
  async getSignificantChanges(stockCode?: string, days = 30): Promise<any[]> {
    let query = this.supabase
      .from('hkex_ccass_changes')
      .select('*')
      .in('severity', ['high', 'critical'])
      .gte('detected_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('detected_at', { ascending: false });

    if (stockCode) {
      query = query.eq('stock_code', stockCode);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Change Tracker] Error fetching significant changes:', error);
      return [];
    }

    return data || [];
  }
}
